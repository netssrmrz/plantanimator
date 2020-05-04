import {LitElement, html, css} from "./lit-element/lit-element.js";
import "./Plant_Dialog.js";
import "./Plant_Code_Gen.js";
import "./Scene_Code_Gen.js";
import * as pl from "./pa.js";

class Shape_List extends LitElement
{
  constructor()
  {
    super();
    this.on_change_fn = null;
    //this.OnClick_Edit_Ok = this.OnClick_Edit_Ok.bind(this);
    //this.this_class = null;
    this.shapes = [];
    //this.stem_plant = null;
    //this.code_gen_type = null;
  }
  
  firstUpdated(changedProperties)
  {
    if (this.Load())
    {
      this.stem_plant = this.plants.find((p) => p.name == "Stem");
      if (this.stem_plant)
      {
        this.Set_Code_Gen_Type("plant_code");
      }
      else
      {
        this.Set_Code_Gen_Type("scene_code");
      }
    }
    else
    {
      this.plants = [];
      this.Set_Code_Gen_Type("plant_code");
    }

    const dlg = this.shadowRoot.getElementById("dlg");
    dlg.onclick_edit_ok = this.OnClick_Edit_Ok;
  }
  
  Set_Code_Gen_Type(code_gen_type)
  {
    this.code_gen_type = code_gen_type;
    this.shadowRoot.getElementById("plant_code").classList.remove("selected");
    this.shadowRoot.getElementById("scene_code").classList.remove("selected");

    if (code_gen_type == "plant_code")
    {
      this.shadowRoot.getElementById("plant_code").classList.add("selected");
      if (!this.stem_plant)
      {
        this.stem_plant = new pl.Plant_Bezier();
        this.stem_plant.name = "Stem";
        this.stem_plant.Set_Pts(0, 0, 0, 1000, -250, 200, 250, 800);
        this.plants.forEach((p) => p.stem_plant = this.stem_plant);
        this.Add_Plant(this.stem_plant, false, false);
        this.requestUpdate();
        if (this.on_change_fn) this.on_change_fn();
      }
    }
    else if (code_gen_type == "scene_code")
    {
      this.shadowRoot.getElementById("scene_code").classList.add("selected");
      if (this.stem_plant)
      {
        this.stem_plant = null;
        this.plants = this.plants.filter((p) => p.name != "Stem");
        this.plants.forEach((p) => p.stem_plant = null);
        this.requestUpdate();
        if (this.on_change_fn) this.on_change_fn();
      }
    }
  }

  Save()
  {
    const plants_json = JSON.stringify(this.plants, this.JSON_Replacer);
    localStorage.setItem("plants", plants_json);
  }

  Load()
  {
    let res = false;

    const plants_json = localStorage.getItem("plants");
    if (plants_json)
    {
      this.plants = JSON.parse(plants_json);
      this.plants = this.plants.map((p) => this.Revive_Plant(p));

      this.stem_plant = this.plants.find((p) => p.name == "Stem");
      this.plants.forEach((p) => p.stem_plant = this.stem_plant);

      this.requestUpdate();
      res = true;
    }

    return res;
  }

  Revive_Plant(obj)
  {
    const plant = new pl[obj.class_name];
    Object.assign(plant, obj);
    plant.Set_Paths();

    return plant;
  }

  JSON_Replacer(key, value)
  {
    if (key == "pt1_btn" || key == "pt2_btn" || key == "ctrl1_btn" || key == "ctrl2_btn" ||
      key == "scale_btn_path" || key == "rotate_btn_path" ||
      key == "move_btn_path" || key == "time_btn_path" || key == "stem_plant")
    {
      value = "dynamic";
    }

    return value;
  }

  Round(num)
  {
    return Math.round((num + Number.EPSILON) * 10000) / 10000;
  }

  Get_Selected_Plant()
  {
    let res;

    const checkbox = this.shadowRoot.querySelector("input[type=checkbox]:checked");
    if (checkbox)
    {
      const i = Number.parseInt(checkbox.value);
      res = this.plants[i];
    }

    return res;
  }

  Set_Disabled(disabled)
  {
    let btns, i;

    btns = this.shadowRoot.querySelectorAll("button");
    if (btns && btns.length>0)
    {
      btns.forEach((btn) => btn.disabled = disabled);
    }
  }

  // Utils ========================================================================================

  Get_Shape_Idx(shape_id)
  {
    let res = null;

    if (this.shapes && this.shapes.length>0)
    {
      for (let i=0; i<this.shapes.length; i++)
      {
        if (this.shapes[i].id == shape_id)
        {
          res = i;
          break;
        }
      }
    }

    return res;
  }

  // API ==========================================================================================

  Add(shape)
  {
    shape.id = Date.now();
    this.shapes.push(shape);
    this.requestUpdate();
  }

  Edit_Plant(shape)
  {
    const i = this.Get_Shape_Idx(plant);
    this.shapes[i] = shape;
    this.requestUpdate();
  }

  Delete(shape_id)
  {
    const msg = "Are you sure you want to delete this shape?";
    let i;

    const do_delete = confirm(msg);
    if (do_delete)
    {
      i = this.Get_Shape_Idx(shape_id);
      this.shapes.splice(i, 1);
      this.requestUpdate();
    }

    return do_delete;
  }

  Select(shape_id)
  {
    let shape;

    if (this.shapes && this.shapes.length>0)
    {
      for (let i=0; i<this.shapes.length; i++)
      {
        shape = this.shapes[i];
        shape.selected = false;
        if (shape.id == shape_id)
        {
          shape.selected = true;
        }
      }
      this.requestUpdate();
    }
  }

  // Events =======================================================================================
  
  OnClick_Delete(event)
  {
    const shape_id = event.currentTarget.getAttribute("shape-id");
    const deleted = this.Delete(shape_id);
    if (deleted && this.on_change_fn)
    {
      this.on_change_fn(this.shapes);
    }
  }

  OnClick_Select(event)
  {
    const shape_id = event.currentTarget.getAttribute("shape-id");
    this.Select(shape_id);
    if (this.on_change_fn)
    {
      this.on_change_fn(this.shapes);
    }
  }

  OnClick_Edit(event)
  {
    const dlg = this.shadowRoot.getElementById("dlg");
    const id = event.currentTarget.getAttribute("plant-id");
    const i = this.Get_Plant_Idx(id);
    const plant = this.plants[i];

    dlg.this_class = this.this_class;
    dlg.Show();
    dlg.Edit(plant);
  }

  OnClick_Edit_Ok(plant)
  {
    const i = this.Get_Plant_Idx(plant.id);
    this.plants[i] = plant;
    this.requestUpdate();
    if (this.on_change_fn)
      this.on_change_fn();
  }

  OnClick_Gen_Code()
  {
    const plant_code_gen = this.shadowRoot.getElementById("plant_code_gen");
    const scene_code_gen = this.shadowRoot.getElementById("scene_code_gen");
    plant_code_gen.Hide();
    scene_code_gen.Hide();

    if (this.code_gen_type == "plant_code")
    {
      plant_code_gen.Show();
      const branches = this.plants.filter((p) => p.name!="Stem");
      const pt1 = {x: this.stem_plant.x1, y: this.stem_plant.y1};
      const pt2 = {x: this.stem_plant.x2, y: this.stem_plant.y2};
      const ctrl1 = {x: this.stem_plant.ctrl1_x, y: this.stem_plant.ctrl1_y};
      const ctrl2 = {x: this.stem_plant.ctrl2_x, y: this.stem_plant.ctrl2_y};
      plant_code_gen.Gen_Code(branches, pt1, pt2, ctrl1, ctrl2);
    }
    else
    {
      scene_code_gen.Show();
      const scene_plants = this.plants.filter((p) => p.name!="Stem");
      scene_code_gen.Gen_Scene(scene_plants);
    }
  }

  OnClick_Code_Type(event)
  {
    this.Set_Code_Gen_Type(event.currentTarget.id);
  }

  OnClick_Reset()
  {
    localStorage.removeItem("plants");
    this.plants = [];
    this.stem_plant = null;
    this.requestUpdate();
    this.Set_Code_Gen_Type(this.code_gen_type);
    if (this.on_change_fn) this.on_change_fn();
  }

  // Rendering ====================================================================================

  static get styles()
  {
    return css`
      :host
      {
        display: block;  
        margin-top: 20px;
      }
      table
      {
        border-collapse: collapse;
        margin-left:auto; 
        margin-right:auto;
      }
      thead
      {
        box-shadow: 
          rgb(0,0,0) 0px 1px 0px 0px, 
          rgb(255,255,255) 0px 4px 0px 0px, 
          rgb(0,0,0) 0px 7px 0px 0px;            
      }
      tbody:before
      {
        display: block;
        content: " ";
        height: 20px;
      }
      tbody tr:hover
      {
        background-color: #ddd;
      }
      tbody:after
      {
        display: block;
        content: " ";
        height: 20px;
      }
      tfoot
      {
        box-shadow: 
          rgb(0,0,0) 0px -1px 0px 0px, 
          rgb(255,255,255) 0px -4px 0px 0px, 
          rgb(0,0,0) 0px -7px 0px 0px;            
      }
      th
      {
        font-weight: 100;
        font-family: serif;
        font-style: italic;
        font-size: 20px;
        padding: 0px 10px;
      }
      td
      {
        padding: 4px 12px;
        font-family: monospace;
        font-size: 16px;
      }
      #btn_bar
      {
        text-align: left;
      }
      button
      {
        border-radius: 7px;
        border: 1px solid #000;
        padding: 5px;
        cursor: pointer;
        width: 36px;
        height: 36px;
        background-color: inherit;
      }
      button:disabled
      {
        opacity: 0.25;
      }
      button img
      {
        padding: 0;
        margin: 0;
        width: 24px;
        height: 24px;
      }
      .selected
      {
        background-color: #0f0;
      }
      .msg
      {
      }
    `;
  }

  render()
  {
    return html`
      <table>
        <thead>
          <tr>
            <th>Actions</th>
            <th>#</th>
            <th>Name</th>
            <th>Class</th>
            <th>X</th>
            <th>Y</th>
          </tr>
        </thead>
        <tbody>
          ${this.Render_Items()}
        </tbody>
        <tfoot>
          <tr>
            <td id="btn_bar" colspan="8">
              <button id="gen_btn" @click="${this.OnClick_Gen_Code}" title="Generate Code"><img src="images/code-json.svg"></button>
              <button id="plant_code" @click="${this.OnClick_Code_Type}" title="Switch to Plant Editing"><img src="images/flower-tulip-outline.svg"></button>
              <button id="scene_code" @click="${this.OnClick_Code_Type}" title="Switch to Scene Editing"><img src="images/image.svg"></button>
              <button id="reset" @click="${this.OnClick_Reset}" title="Reset"><img src="images/nuke.svg"></button>
            </td>
          </tr>
        </tfoot>
      </table>
      <!--plant-dlg id="dlg"></plant-dlg>
      <plant-code-gen id="plant_code_gen"></plant-code-gen>
      <scene-code-gen id="scene_code_gen"></scene-code-gen-->
      `;
  }

  Render_Items()
  {
    let res = "", shape;

    if (this.shapes && this.shapes.length>0)
    {
      for (let i=0; i<this.shapes.length; i++)
      {
        shape = this.shapes[i];
        res = html`${res}${this.Render_Item(i, shape)}`;
      }
    }
    else
    {
      res = html`<tr><td class="msg" colspan=9>No shapes added yet. Get to work!</td></tr>`;
    }
    return res;
  }

  Render_Item(i, shape)
  {
    let btn_class;

    if (shape.selected)
    {
      btn_class = "selected";
    }

    return html`
      <tr plant-id="${shape.id}">
        <td>
          ${this.Render_Button(shape.id, this.OnClick_Select, "target.svg", true, "Select", btn_class)}
          ${this.Render_Button(shape.id, this.OnClick_Edit, "pencil-outline.svg", shape.can_edit, "Edit", null)}
          ${this.Render_Button(shape.id, this.OnClick_Delete, "delete-outline.svg", shape.can_delete, "Delete", null)}
        </td>
        <td>${i+1}</td>
        <td>${shape.name}</td>
        <td>${shape.class_name}</td>
        <td>${shape.x}</td>
        <td>${shape.y}</td>
      </tr>
      `;
  }

  Render_Button(id, on_click_fn, image, can_render, title, btn_class)
  {
    let res;

    if (can_render == null || can_render == true)
    {
      if (!btn_class)
        btn_class = "";
      res = html`<button shape-id="${id}" @click="${on_click_fn}" title="${title}" class="${btn_class}"><img src="images/${image}"></button>`;
    }
    return res;
  }
}

customElements.define('shape-list', Shape_List);

/*
class Shape
{
  id: null,
  name: null,
  class_name: null,
  x: null,
  y: null,
  selected: false,
  can_edit: true,
  can_delete: true
}
*/
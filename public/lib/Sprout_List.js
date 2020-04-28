import {LitElement, html, css} from "./lit-element/lit-element.js";
import "./Sprout_Props_Dialog.js";
import { Bezier } from "./bezierjs/bezier.js";
import "./Plant_Code_Gen.js";

class Plant_Bezier
{
  constructor()
  {
    this.name = null;
    this.class_name = "Plant_Bezier";
    this.x = 0;
    this.y = 0;
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    this.ctrl1_x = 0;
    this.ctrl1_y = 0;
    this.ctrl2_x = 0;
    this.ctrl2_y = 0;
    this.angle = 0;
    this.x_scale = 1;
    this.y_scale = 1;
    this.pt1_btn = this.New_Btn_Path(12, "pt1");
    this.pt2_btn = this.New_Btn_Path(12, "pt2");
    this.ctrl1_btn = this.New_Btn_Path(12, "ctrl1");
    this.ctrl2_btn = this.New_Btn_Path(12, "ctrl2");
    this.cmd = null;
    this.trunk_pts = null;
  }

  New_Btn_Path(size, id)
  {
    let btn_path;

    btn_path = new Path2D();
    btn_path.colour = "deeppink";
    btn_path.colour_hover = "#0f0";
    btn_path.hover = false;
    btn_path.rect(-0.5*size, -0.5*size, size, size);
    btn_path.size = size;
    btn_path.id = id;

    return btn_path;
  }

  Set_Pts(x1, y1, x2, y2, ctrl1_x, ctrl1_y, ctrl2_x, ctrl2_y)
  {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.ctrl1_x = ctrl1_x;
    this.ctrl1_y = ctrl1_y;
    this.ctrl2_x = ctrl2_x;
    this.ctrl2_y = ctrl2_y;

    const curve = new Bezier
      (this.x1, this.y1, this.ctrl1_x, this.ctrl1_y, this.ctrl2_x, this.ctrl2_y, this.x2, this.y2);
    this.trunk_pts = curve.getLUT(100);
  }

  Get_Trunk_Pt(sprout_time)
  {
    let trunk_pt_idx = Math.trunc(sprout_time+0.5);
    if (trunk_pt_idx < 0)
    {
      trunk_pt_idx = 0;
    }
    else if (trunk_pt_idx >= this.trunk_pts.length)
    {
      trunk_pt_idx = this.trunk_pts.length -1;
    }

    return this.trunk_pts[trunk_pt_idx];
  }

  To_Canvas_Pt(ctx, sx, sy)
  {
    return {x: sx-ctx.canvas.width/2-4, y: ctx.canvas.height-sy+4};
  }

  // Events =======================================================================================

  On_Mouse_Up(event, ctx)
  {
    let res = false;

    if (this.cmd)
    {
      if (this.cmd.id == "pt1" || this.cmd.id == "pt2" || this.cmd.id == "ctrl1" || this.cmd.id == "ctrl2")
      {
        this.Set_Pts(this.x1, this.y1, this.x2, this.y2, this.ctrl1_x, this.ctrl1_y, this.ctrl2_x, this.ctrl2_y);
      }
      this.cmd = null;
      res = true;
    }

    return res;
  }

  On_Mouse_Move(event, ctx)
  {
    let res = false;

    if (this.cmd)
    {
      const c_pt = this.To_Canvas_Pt(ctx, event.offsetX, event.offsetY);
      if (this.cmd.id == "pt1")
      {
        this.x1 = c_pt.x;
        this.y1 = c_pt.y;
      }
      else if (this.cmd.id == "pt2")
      {
        this.x2 = c_pt.x;
        this.y2 = c_pt.y;
      }
      else if (this.cmd.id == "ctrl1")
      {
        this.ctrl1_x = c_pt.x;
        this.ctrl1_y = c_pt.y;
      }
      else if (this.cmd.id == "ctrl2")
      {
        this.ctrl2_x = c_pt.x;
        this.ctrl2_y = c_pt.y;
      }
      res = true;
    }
    else if (this.selected)
    {
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.pt1_btn, this.x1, this.y1);
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.pt2_btn, this.x2, this.y2);
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.ctrl1_btn, this.ctrl1_x, this.ctrl1_y);
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.ctrl2_btn, this.ctrl2_x, this.ctrl2_y);
    }

    return res;
  }

  On_Mouse_Move_Btn(ctx, event, path, x, y)
  {
    let res = false;

    ctx.save();
    ctx.translate(x, y);
    const is_in_path = ctx.isPointInPath(path, event.offsetX, event.offsetY);
    if (path.hover != is_in_path)
    {
      path.hover = is_in_path;
      res = true;
    }
    ctx.restore();

    return res;
  }

  On_Mouse_Down(event, ctx)
  {
    if (this.selected)
    {
      if (this.pt1_btn.hover)
      {
        this.cmd = {id: "pt1"};
      }
      if (this.pt2_btn.hover)
      {
        this.cmd = {id: "pt2"};
      }
      if (this.ctrl1_btn.hover)
      {
        this.cmd = {id: "ctrl1"};
      }
      if (this.ctrl2_btn.hover)
      {
        this.cmd = {id: "ctrl2"};
      }
    }

    return false;
  }

  // Gfx ==========================================================================================

  Render()
  {

  }

  Render_Design(ctx)
  {
    if (this.selected)
    {
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
    }
    else
    {
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 1;
    }

    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.moveTo(this.trunk_pts[0].x, this.trunk_pts[0].y);
    for (let i=1; i<this.trunk_pts.length; i++)
    {
      ctx.lineTo(this.trunk_pts[i].x, this.trunk_pts[i].y);
    }
    ctx.stroke();

    if (this.selected)
    {
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.strokeStyle="#aaa";
      ctx.beginPath();
      ctx.moveTo(this.x1, this.y1);
      ctx.lineTo(this.ctrl1_x, this.ctrl1_y);
      ctx.moveTo(this.x2, this.y2);
      ctx.lineTo(this.ctrl2_x, this.ctrl2_y);
      ctx.stroke();

      this.Render_Btn(ctx, this.pt1_btn, this.x1, this.y1);
      this.Render_Btn(ctx, this.pt2_btn, this.x2, this.y2);
      this.Render_Btn(ctx, this.ctrl1_btn, this.ctrl1_x, this.ctrl1_y);
      this.Render_Btn(ctx, this.ctrl2_btn, this.ctrl2_x, this.ctrl2_y);
    }
  }

  Render_Btn(ctx, path, x, y)
  {
    ctx.save();
    ctx.translate(x, y);

    if (path.hover)
    {
      ctx.fillStyle = path.colour_hover;
    }
    else
    {
      ctx.fillStyle = path.colour;
    }
    ctx.fill(path);

    ctx.restore();
  }
}

class Sprout_List extends LitElement
{
  constructor()
  {
    super();
    this.on_change_fn = null;
    this.OnClick_Edit_Ok = this.OnClick_Edit_Ok.bind(this);
    this.this_class = null;

    this.stem_plant = new Plant_Bezier();
    this.stem_plant.name = "Stem";
    this.stem_plant.Set_Pts(0, 0, 0, 1000, -250, 200, 250, 800);

    this.plants = [];
    this.Add_Plant(this.stem_plant, false, false);
  }
  
  firstUpdated(changedProperties)
  {
    const dlg = this.shadowRoot.getElementById("dlg");
    dlg.onclick_edit_ok = this.OnClick_Edit_Ok;
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

  Add_Plant(plant, can_edit, can_delete)
  {
    plant.id = this.plants.length;
    plant.stem_plant = this.stem_plant;
    plant.can_edit = true;
    if (can_edit != null)
    {
      plant.can_edit = can_edit;
    }
    plant.can_delete = true;
    if (can_delete != null)
    {
      plant.can_delete = can_delete;
    }

    this.plants.push(plant);
    this.Select_Plant(plant.id);

    this.requestUpdate();
  }

  Edit_Plant(plant)
  {
    const i = this.Get_Plant_Idx(plant);
    this.plants[i] = plant;
    this.requestUpdate();
  }

  Select_Plant(plant_id)
  {
    let plant;

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        plant.selected = false;
        if (plant.id == plant_id)
        {
          plant.selected = true;
        }
      }
      this.requestUpdate();
    }
  }

  Delete_Plant(plant_id)
  {
    const msg = "Are you sure you want to delete this plant?";
    let i;

    const do_delete = confirm(msg);
    if (do_delete)
    {
      i = this.Get_Plant_Idx(plant_id);
      this.plants.splice(i, 1);
      this.requestUpdate();
    }

    return do_delete;
  }

  Get_Plant_Idx(plant_id)
  {
    let res = null;

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        if (this.plants[i].id == plant_id)
        {
          res = i;
          break;
        }
      }
    }

    return res;
  }

  OnClick_Delete_Plant(event)
  {
    const plant_id = event.currentTarget.getAttribute("plant-id");
    const deleted = this.Delete_Plant(plant_id);
    if (deleted && this.on_change_fn)
    {
      this.on_change_fn();
    }
  }

  OnClick_Select_Plant(event)
  {
    const plant_id = event.currentTarget.getAttribute("plant-id");
    this.Select_Plant(plant_id);
    if (this.on_change_fn)
    {
      this.on_change_fn();
    }
  }

  OnClick_Edit_Plant(event)
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
    const code = this.shadowRoot.getElementById("code");
    code.Show();
    const branches = this.plants.filter((p) => p.name!="Stem");
    const pt1 = {x: this.stem_plant.x1, y: this.stem_plant.y1};
    const pt2 = {x: this.stem_plant.x2, y: this.stem_plant.y2};
    const ctrl1 = {x: this.stem_plant.ctrl1_x, y: this.stem_plant.ctrl1_y};
    const ctrl2 = {x: this.stem_plant.ctrl2_x, y: this.stem_plant.ctrl2_y};
    code.Gen_Code(branches, pt1, pt2, ctrl1, ctrl2);
  }

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
      th
      {
        font-weight: 100;
        font-family: serif;
        font-style: italic;
        font-size: 20px;
        xtext-transform: uppercase;
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
            <th>X Scale</th>
            <th>Y Scale</th>
            <th>Angle</th>
          </tr>
        </thead>
        <tbody>
          ${this.Render_Items()}
        </tbody>
        <tfoot>
          <tr>
            <td id="btn_bar" colspan="8">
              <button id="gen_btn" @click="${this.OnClick_Gen_Code}"><img src="images/code-json.svg"></button>
            </td>
          </tr>
        </tfoot>
      </table>
      <sprout-props-dlg id="dlg"></sprout-props-dlg>
      <plant-code-gen id="code"></plant-code-gen>
      `;
  }

  Render_Items()
  {
    let res = "", plant;

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        res = html`${res}${this.Render_Item(i, plant)}`;
      }
    }
    return res;
  }

  Render_Item(i, plant)
  {
    let row_class = "";

    if (plant.selected)
    {
      row_class = "selected";
    }

    return html`
      <tr plant-id="${plant.id}" class="${row_class}">
        <td>
          <button plant-id="${plant.id}" @click="${this.OnClick_Select_Plant}"><img src="images/target.svg"></button>
          ${this.Render_Button(plant.id, this.OnClick_Edit_Plant, "pencil-outline.svg", plant.can_edit)}
          ${this.Render_Button(plant.id, this.OnClick_Delete_Plant, "delete-outline.svg", plant.can_delete)}
        </td>
        <td>${i+1}</td>
        <td>${plant.name}</td>
        <td>${plant.class_name}</td>
        <td>${plant.x}</td>
        <td>${plant.y}</td>
        <td>${this.Round(plant.x_scale)}</td>
        <td>${this.Round(plant.y_scale)}</td>
        <td>${this.Round(plant.angle)}</td>
      </tr>
      `;
  }

  Render_Button(id, on_click_fn, image, can_render)
  {
    let res;

    if (can_render)
    {
      res = html`<button plant-id="${id}" @click="${on_click_fn}"><img src="images/${image}"></button>`;
    }
    return res;
  }
}

customElements.define('sprout-list', Sprout_List);

import {LitElement, html, css} from "./lit-element/lit-element.js";
import "./Plant_Dialog.js";
import "./Scene_Code_Gen.js";

class Plant_List extends LitElement
{
  constructor()
  {
    super();
    this.plants = [];
    this.on_change_fn = null;
    this.OnClick_Edit_Ok = this.OnClick_Edit_Ok.bind(this);
  }
  
  firstUpdated(changedProperties)
  {
    const dlg = this.shadowRoot.getElementById("dlg");
    
    dlg.onclick_edit_ok = this.OnClick_Edit_Ok;
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

  Add_Plant(plant)
  {
    plant.id = this.plants.length;
    this.plants.push(plant);
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
    code.Gen_Scene(this.plants);
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
            <td id="btn_bar" colspan="9">
              <button id="gen_btn" @click="${this.OnClick_Gen_Code}"><img src="images/code-json.svg"></button>
            </td>
          </tr>
        </tfoot>
      </table>
      <plant-dlg id="dlg"></plant-dlg>
      <scene-code-gen id="code"></scene-code-gen>
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
          <button plant-id="${plant.id}" @click="${this.OnClick_Edit_Plant}"><img src="images/pencil-outline.svg"></button>
          <button plant-id="${plant.id}" @click="${this.OnClick_Delete_Plant}"><img src="images/delete-outline.svg"></button>
        </td>
        <td>${i+1}</td>
        <td>${plant.name}</td>
        <td>${plant.class_name}</td>
        <td>${plant.x}</td>
        <td>${plant.y}</td>
        <td>${plant.x_scale}</td>
        <td>${plant.y_scale}</td>
        <td>${plant.angle}</td>
      </tr>
      `;
  }
}

customElements.define('plant-list', Plant_List);

import {LitElement, html, css} from "./lit-element/lit-element.js";
import * as pl from "./pa.js";

class Plant_Props_Dialog extends LitElement 
{
  constructor()
  {
    super();
    this.onclick_edit_ok = null;
    this.plant = null;
  }

  firstUpdated(changedProperties)
  {
    this.plant_name_elem = this.shadowRoot.getElementById("plant_name");
    this.plant_class_elem = this.shadowRoot.getElementById("plant_class");
    this.plant_x_pos_elem = this.shadowRoot.getElementById("plant_x_pos");
    this.plant_y_pos_elem = this.shadowRoot.getElementById("plant_y_pos");
    this.plant_x_scale_elem = this.shadowRoot.getElementById("plant_x_scale");
    this.plant_y_scale_elem = this.shadowRoot.getElementById("plant_y_scale");
    this.plant_angle_elem = this.shadowRoot.getElementById("plant_angle");
    this.new_ok_btn = this.shadowRoot.getElementById("new_plant_ok_btn");
    this.edit_ok_btn = this.shadowRoot.getElementById("edit_plant_ok_btn");
  }

  OnClick_New_Ok()
  {
    var plant = new pl[this.plant_class_elem.value];
    plant.class_name = this.plant_class_elem.value;
    plant.name = this.plant_name_elem.value;
    plant.maturity_rate = 1;
    plant.maturity = 0;
    plant.x = Number.parseFloat(this.plant_x_pos_elem.value);
    plant.y = Number.parseFloat(this.plant_y_pos_elem.value);
    plant.x_scale = Number.parseFloat(this.plant_x_scale_elem.value);
    plant.y_scale = Number.parseFloat(this.plant_y_scale_elem.value);
    plant.angle = Number.parseFloat(this.plant_angle_elem.value);
    this.Hide();
    this.onclick_new_ok(plant);
  }

  OnClick_Edit_Ok()
  {
    var plant = new pl[this.plant_class_elem.value];
    plant.id = this.plant_i;
    plant.class_name = this.plant_class_elem.value;
    plant.name = this.plant_name_elem.value;
    plant.maturity_rate = 1;
    plant.maturity = 100;
    plant.level = 1;
    plant.x = this.plant_x_pos_elem.value;
    plant.y = this.plant_y_pos_elem.value;
    plant.x_scale = this.plant_x_scale_elem.value;
    plant.y_scale = this.plant_y_scale_elem.value;
    plant.angle = this.plant_angle_elem.value;
    plant.selected = this.plant.selected;
    
    this.Hide();
    this.onclick_edit_ok(plant);
  }

  OnClick_Cancel()
  {
    this.Hide();
  }

  New()
  {
    this.plant_name_elem.value = "Plant 1";
    this.plant_class_elem.value = "Plant1";
    this.plant_x_pos_elem.value = "500";
    this.plant_y_pos_elem.value = "500";
    this.plant_x_scale_elem.value = "1";
    this.plant_y_scale_elem.value = "1";
    this.plant_angle_elem.value = "0";
    this.new_ok_btn.hidden = false;
    this.edit_ok_btn.hidden = true;
  }

  Edit(plant)
  {
    this.plant = plant;
    this.plant_i = plant.id;
    this.plant_name_elem.value = plant.name;
    this.plant_class_elem.value = plant.class_name;
    this.plant_x_pos_elem.value = plant.x;
    this.plant_y_pos_elem.value = plant.y;
    this.plant_x_scale_elem.value = plant.x_scale;
    this.plant_y_scale_elem.value = plant.y_scale;
    this.plant_angle_elem.value = plant.angle;
    this.new_ok_btn.hidden = true;
    this.edit_ok_btn.hidden = false;
  }

  Hide()
  {
    this.style.display = "none";
  }

  Show()
  {
    this.style.display = "grid";
  }

  static get styles()
  {
    return css`
      :host
      {
        display: none;
        grid-template-columns: 1fr 1fr;
        grid-row-gap: 10px;
        grid-column-gap: 10px;
      }
      input
      {
        border: 0;
        background-color: inherit;
        padding: 0;
        margin: 0;
        border-bottom: 1px solid #000;
        font-family: monospace;
        font-size: 16px;
        width: 200px;
      }
      label
      {
        margin-right: 10px;
        padding: 0;
        margin: 0;
        font-weight: 100;
        font-family: serif;
        font-style: italic;
        font-size: 20px;
        text-align: right;
      }
      span
      {
        text-align: left;
      }
      #btns
      {
        grid-column-start: 2;
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
      button img
      {
        padding: 0;
        margin: 0;
        width: 24px;
        height: 24px;
      }
      button:disabled
      {
        opacity: 0.25;
      }
      #plant_x_pos, #plant_y_pos, #plant_x_scale, #plant_y_scale, #plant_angle
      {
        width: 100px;
      }
    `;
  }

  render() 
  {
    return html`
      <label>Name</label>
      <span><input id="plant_name" type="text"></span>
      <label>Class</label>
      <span><input id="plant_class" type="text" disabled></span>
      <label>X Position</label>
      <span><input id="plant_x_pos" type="number"></span>
      <label>Y Position</label>
      <span><input id="plant_y_pos" type="number"></span>
      <label>X Scale</label>
      <span><input id="plant_x_scale" type="number"></span>
      <label>Y Scale</label>
      <span><input id="plant_y_scale" type="number"></span>
      <label>Angle</label>
      <span><input id="plant_angle" type="number"></span>
      <div id="btns">
        <button id="new_plant_ok_btn" @click="${this.OnClick_New_Ok}"><img src="images/check.svg"></button>
        <button id="edit_plant_ok_btn" @click="${this.OnClick_Edit_Ok}"><img src="images/check.svg"></button>
        <button id="new_plant_cancel_btn" @click="${this.OnClick_Cancel}"><img src="images/close.svg"></button>
      </div>
      `;
  }
}

customElements.define('plant-props-dlg', Plant_Props_Dialog);

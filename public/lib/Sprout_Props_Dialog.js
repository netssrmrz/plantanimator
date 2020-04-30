import {LitElement, html, css} from "./lit-element/lit-element.js";
import * as pl from "./pa.js";

class Sprout_Props_Dialog extends LitElement 
{
  constructor()
  {
    super();
    this.onclick_edit_ok = null;
    this.plant = null;
    this.this_class = null;
  }

  firstUpdated(changedProperties)
  {
    this.plant_name_elem = this.shadowRoot.getElementById("plant_name");
    this.plant_class_elem = this.shadowRoot.getElementById("plant_class");
    this.sprout_time_elem = this.shadowRoot.getElementById("sprout_time");
    this.plant_x_elem = this.shadowRoot.getElementById("plant_x");
    this.plant_y_elem = this.shadowRoot.getElementById("plant_y");
    this.plant_x_scale_elem = this.shadowRoot.getElementById("plant_x_scale");
    this.plant_y_scale_elem = this.shadowRoot.getElementById("plant_y_scale");
    this.plant_angle_elem = this.shadowRoot.getElementById("plant_angle");
    this.new_ok_btn = this.shadowRoot.getElementById("new_plant_ok_btn");
    this.edit_ok_btn = this.shadowRoot.getElementById("edit_plant_ok_btn");
  }

  Get_User_Input(plant)
  {
    plant.class_name = this.plant_class_elem.value;
    plant.name = this.plant_name_elem.value;
    plant.sprout_time = Number.parseFloat(this.sprout_time_elem.value);
    plant.x = Number.parseFloat(this.plant_x_elem.value);
    plant.y = Number.parseFloat(this.plant_y_elem.value);
    plant.x_scale = Number.parseFloat(this.plant_x_scale_elem.value);
    plant.y_scale = Number.parseFloat(this.plant_y_scale_elem.value);
    plant.angle = Number.parseFloat(this.plant_angle_elem.value);
  }

  OnClick_New_Ok()
  {
    var plant = new pl[this.plant_class_elem.value];
    plant.maturity_rate = 1;
    plant.maturity = 0;
    plant.max_depth = 3;
    plant.level = 0;
    plant.selected = false;
    this.Get_User_Input(plant);

    this.Hide();
    this.onclick_new_ok(plant);
  }

  OnClick_Edit_Ok()
  {
    var plant;
    
    if (this.plant_class_elem.value == "This")
    {
      plant = new this.this_class();
    }
    else
    {
      plant = new pl[this.plant_class_elem.value];
    }
    plant.id = this.plant.id;
    plant.maturity_rate = this.plant.maturity_rate;
    plant.maturity = this.plant.maturity;
    plant.max_depth = this.plant.max_depth;
    plant.level = this.plant.level;
    plant.selected = this.plant.selected;
    this.Get_User_Input(plant);
    
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
    this.sprout_time_elem.value = "50";
    this.plant_x_elem.value = "500";
    this.plant_y_elem.value = "500";
    this.plant_x_scale_elem.value = "1";
    this.plant_y_scale_elem.value = "1";
    this.plant_angle_elem.value = "0";
    this.new_ok_btn.hidden = false;
    this.edit_ok_btn.hidden = true;
  }

  Edit(plant)
  {
    this.plant = plant;

    this.plant_name_elem.value = plant.name;
    this.plant_class_elem.value = plant.class_name;
    this.sprout_time_elem.value = plant.sprout_time;
    this.plant_x_elem.value = plant.x;
    this.plant_y_elem.value = plant.y;
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
      select
      {
        border: 0;
        background-color: inherit;
        padding: 0;
        margin: 0;
        border-bottom: 1px solid #000;
        font-family: monospace;
        font-size: 16px;
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
      <span>
        <select id="plant_class">
          <option>This</option>
          <option>Plant_Flower</option>
          <option>Plant_Flower2</option>
          <option>Plant_Flower3</option>
          <option>Plant_Flower4</option>
          <option>Plant_Flower5</option>
          <option>Plant_Flower6</option>
          <option>Plant_Flower7</option>
          <option>Plant_Flower8</option>
          <option>Plant_Flower9</option>
          <option>Plant_Flower10</option>
          <option>Plant_Flower11</option>
          <option>Plant_Flower12</option>
          <option>Plant_Leaf</option>
          <option>Plant_Leaf2</option>
          <option>Plant_Leaf3</option>
          <option>Plant_Leaf4</option>
          <option>Plant_Leaf5</option>
          <option>Plant_Leaf6</option>
          <option>Plant_Leaf7</option>
          <option>Plant_Leaf8</option>
          <option>Plant_Leaf9</option>
          <option>Plant_Leaf10</option>
          <option>Plant_Leaf11</option>
          <option>Plant_Leaf12</option>
          <option>Plant_Stem1</option>
          <option>Plant_Stem2</option>
          <option>Plant_Stem3</option>
          <option>Plant_Stem4</option>
          <option>Plant_Stem5</option>
          <option>Plant_Stem6</option>
        </select>
      </span>
      <label>Sprout Time</label>
      <span><input id="sprout_time" type="number"></span>
      <label>X</label>
      <span><input id="plant_x" type="number"></span>
      <label>Y</label>
      <span><input id="plant_y" type="number"></span>
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

customElements.define('sprout-props-dlg', Sprout_Props_Dialog);

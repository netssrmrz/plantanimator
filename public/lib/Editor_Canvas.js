import {LitElement, html, css} from "./lit-element/lit-element.js";
import * as pl from "./pa.js";

const pot_size = 100;

class Editor_Canvas extends LitElement
{
  constructor()
  {
    super();
    this.plants = null;
    this.OnMouseMove_Canvas = this.OnMouseMove_Canvas.bind(this);
    this.OnMouseDown_Canvas = this.OnMouseDown_Canvas.bind(this);
    this.OnMouseUp_Canvas = this.OnMouseUp_Canvas.bind(this);
    this.Render_Plants = this.Render_Plants.bind(this);
    this.OnFinish_Play = this.OnFinish_Play.bind(this);
    this.is_playing = false;
    this.on_finish_play_fn = null;
    this.colour = "#000";
    this.colour_selected = "#0f0";
    this.move_plant = null;
    this.scale_plant = null;
    this.rotate_plant = null;
  }
  
  firstUpdated(changedProperties)
  {
    this.canvas = this.shadowRoot.getElementById("main_canvas");
    this.canvas.addEventListener('mousemove', this.OnMouseMove_Canvas);
    this.canvas.addEventListener('mousedown', this.OnMouseDown_Canvas);
    this.canvas.addEventListener('mouseup', this.OnMouseUp_Canvas);
    this.ctx = this.canvas.getContext("2d");
  }

  Init_Btns(plant, sqr_size)
  {
    let btn_size, x, y;

    // scale btn
    if (!plant.scale_btn_path)
    {
      btn_size = 10;
      x = (sqr_size/2)-btn_size;
      y = (sqr_size/2)-btn_size;
      plant.scale_btn_path = new Path2D();
      plant.scale_btn_path.colour = "#f00";
      plant.scale_btn_path.colour_hover = "#0f0";
      plant.scale_btn_path.hover = false;
      plant.scale_btn_path.rect(x, y, btn_size, btn_size);
    }

    // rotate btn
    if (!plant.rotate_btn_path)
    {
      btn_size = 10;
      x = (sqr_size/2)-btn_size;
      y = -(btn_size/2);
      plant.rotate_btn_path = new Path2D();
      plant.rotate_btn_path.colour = "#f00";
      plant.rotate_btn_path.colour_hover = "#0f0";
      plant.rotate_btn_path.hover = false;
      plant.rotate_btn_path.rect(x, y, btn_size, btn_size);
    }

    // translate btn
    if (!plant.move_btn_path)
    {
      btn_size = 10;
      x = -(btn_size/2);
      y = -(btn_size/2);
      plant.move_btn_path = new Path2D();
      plant.move_btn_path.colour = "#f00";
      plant.move_btn_path.colour_hover = "#0f0";
      plant.move_btn_path.hover = false;
      plant.move_btn_path.rect(x, y, btn_size, btn_size);
    }
  }

  Play(on_finish_play_fn)
  {
    let plant; 

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        plant.canvas_ctx = this.ctx;
        plant.Reset();
      }
      this.is_playing = true;
      this.on_finish_play_fn = on_finish_play_fn;
      pl.Animate(this.ctx, this.plants, this.OnFinish_Play, this.Render_Plants);
    }
  }

  OnFinish_Play()
  {
    this.is_playing = false;
    if (this.on_finish_play_fn)
    {
      this.on_finish_play_fn();
    }
  }

  Stop()
  {
    if (this.is_playing)
    {
      this.ctx.stop = true;
      this.is_playing = false;
    }
  }

  Render_Plants()
  {
    let plant;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        this.Render_Plant(plant);
      }
    }
  }

  Render_Plant(plant)
  {
    let x, y;
    x = -(pot_size/2);
    y = -(pot_size/2);

    this.Init_Btns(plant, pot_size);

    this.ctx.save();
    this.ctx.translate(plant.x, plant.y);
    this.ctx.rotate(plant.angle);
    this.ctx.scale(plant.x_scale, plant.y_scale);

    if (plant.selected)
    {
      this.ctx.strokeStyle = this.colour_selected;
    }
    else
    {
      this.ctx.strokeStyle = this.colour;
    }
    this.ctx.strokeRect(x, y, pot_size, pot_size);          

    this.Render_Btn(plant.scale_btn_path);
    this.Render_Btn(plant.rotate_btn_path);
    this.Render_Btn(plant.move_btn_path);

    this.ctx.restore();
  }

  Render_Btn(path)
  {
    if (path.hover)
    {
      this.ctx.fillStyle = path.colour_hover;
    }
    else
    {
      this.ctx.fillStyle = path.colour;
    }

    this.ctx.fill(path);
  }

  OnMouseMove_Canvas(event)
  {
    let plant, do_render;

    plant = this.Get_MouseEvent_Plant(event);
    if (plant)
    {
      do_render = true;
    }

    if (this.move_plant)
    {
      this.move_plant.x = event.offsetX;
      this.move_plant.y = event.offsetY;
      do_render = true;
    }
    if (this.scale_plant)
    {
      const m = new DOMMatrix();
      m.translateSelf(this.scale_plant.x, this.scale_plant.y);
      m.rotateSelf(this.To_Degrees(this.scale_plant.angle));
      m.invertSelf();
      const p = new DOMPoint(event.offsetX, event.offsetY);
      const tp = p.matrixTransform(m);
      this.scale_plant.x_scale = tp.x / (pot_size/2);
      this.scale_plant.y_scale = tp.y / (pot_size/2);
      do_render = true;
    }
    if (this.rotate_plant)
    {
      const x_sign = Math.sign(this.rotate_plant.x_scale);
      const y_sign = Math.sign(this.rotate_plant.y_scale);
      const m = new DOMMatrix();
      m.translateSelf(this.rotate_plant.x, this.rotate_plant.y);
      m.scaleSelf(x_sign, y_sign);
      m.invertSelf();
      const p = new DOMPoint(event.offsetX, event.offsetY);
      const tp = p.matrixTransform(m);
      this.rotate_plant.angle = Math.atan2(tp.y, tp.x) * (x_sign*y_sign);
      do_render = true;
    }

    if (do_render)
    {
      this.Render_Plants();
    }
  }

  To_Degrees(r)
  {
    return r*(180/Math.PI);
  }

  Get_MouseEvent_Plant(event)
  {
    let plant, i, res;

    if (this.plants && this.plants.length>0)
    {
      for (i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        this.Set_Plant_MouseEvent(plant, event);
        if (plant.scale_btn_path.hover || plant.rotate_btn_path.hover || plant.move_btn_path.hover)
        {
          res = plant;
          break;
        }
      }
    }

    return res;
  }

  Set_Plant_MouseEvent(plant, event)
  {
    this.ctx.save();
    this.ctx.translate(plant.x, plant.y);
    this.ctx.rotate(plant.angle);
    this.ctx.scale(plant.x_scale, plant.y_scale);
    plant.scale_btn_path.hover = this.ctx.isPointInPath(plant.scale_btn_path, event.offsetX, event.offsetY);
    plant.rotate_btn_path.hover = this.ctx.isPointInPath(plant.rotate_btn_path, event.offsetX, event.offsetY);
    plant.move_btn_path.hover = this.ctx.isPointInPath(plant.move_btn_path, event.offsetX, event.offsetY);
    this.ctx.restore();
  }

  OnMouseDown_Canvas(event)
  {
    let plant;

    plant = this.Get_MouseEvent_Plant(event);
    if (plant && plant.move_btn_path.hover)
    {
      this.move_plant = plant;
    }
    if (plant && plant.scale_btn_path.hover)
    {
      this.scale_plant = plant;
    }
    if (plant && plant.rotate_btn_path.hover)
    {
      this.rotate_plant = plant;
    }

    /*if (this.plant_list)
    {
      this.plant_list.Select_Plant(plant);
    }*/
  }

  OnMouseUp_Canvas(event)
  {
    let plant;

    if (this.move_plant)
    {
      plant = this.move_plant;
    }
    if (this.scale_plant)
    {
      plant = this.scale_plant;
    }
    if (this.rotate_plant)
    {
      plant = this.rotate_plant;
    }
    if (plant)
    {
      this.plants.forEach((plant) => plant.selected = false);
      plant.selected = true;
      this.Render_Plants();
    }

    this.move_plant = null;
    this.scale_plant = null;
    this.rotate_plant = null;

    if (this.on_change_fn)
    {
      this.on_change_fn(plant);
    }
  }

  static get properties()
  {
    return {plant_list_id: {type: String}};
  }

  static get styles()
  {
    return css`
      canvas
      {
        border: 0;
        box-shadow: 
          0px 0px 0px 1px rgb(0,0,0), 
          0px 0px 0px 4px rgb(255, 255, 255), 
          0px 0px 0px 7px rgb(0, 0, 0);
        margin: 7px;
        padding: 3px;      
      }
    `;
  }

  render()
  {
    return html`<canvas id="main_canvas" width="1000" height="1000"></canvas>`;
  }
}

customElements.define('editor-canvas', Editor_Canvas);

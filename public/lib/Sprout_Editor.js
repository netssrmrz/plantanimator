import {LitElement, html, css} from "./lit-element/lit-element.js";
import * as pl from "./pa.js";
import { Bezier } from "./bezierjs/bezier.js";

const pot_size = 100;

class Sprout_Editor extends LitElement
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
    this.colour = "#aaa";
    this.colour_selected = "#000";

    this.move_plant = null;
    this.scale_plant = null;
    this.rotate_plant = null;
    this.time_plant = null;

    this.trunk_pts = Get_Trunk_Pts();

    this.time_btn_path = null;
    this.move_btn_path = null;
    this.rotate_btn_path = null;
    this.scale_btn_path = null;
  }
  
  firstUpdated(changedProperties)
  {
    this.canvas = this.shadowRoot.getElementById("main_canvas");
    this.canvas.addEventListener('mousemove', this.OnMouseMove_Canvas);
    this.canvas.addEventListener('mousedown', this.OnMouseDown_Canvas);
    this.canvas.addEventListener('mouseup', this.OnMouseUp_Canvas);
    this.ctx = this.canvas.getContext("2d");
    this.ctx.translate(this.canvas.width/2, this.canvas.height);
    this.ctx.scale(1, -1);
    this.Render_Plants();
  }

  Play(on_finish_play_fn)
  {
    this.is_playing = true;
    this.on_finish_play_fn = on_finish_play_fn;

    const plant = new Plant();
    plant.sprouts = this.plants;
    //item.class_name = class_name;
    //item.name = "Sprout 1";
    plant.maturity_rate = 1;
    plant.maturity = 0;
    plant.max_depth = 3;
    plant.x = 0;
    plant.y = 0;
    plant.x_scale = 1;
    plant.y_scale = 1;
    plant.angle = 0;
    //item.sprout_time = 50;
    plant.canvas_ctx = this.ctx;

    this.Clr();
    pl.Animate(this.ctx, [plant], this.OnFinish_Play, this.Render_Plants);
  }

  Stop()
  {
    if (this.is_playing)
    {
      this.ctx.stop = true;
      this.is_playing = false;
    }
  }

  To_Degrees(r)
  {
    return r*(180/Math.PI);
  }

  To_Canvas_Pt(sx, sy)
  {
    return {x: sx-this.canvas.width/2-4, y: this.canvas.height-sy+4};
  }

  Get_MouseEvent_Plant(event)
  {
    let plant, i, res;

    if (this.plants && this.plants.length>0)
    {
      for (i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        this.Set_Event_In_Btn(plant, event, plant.scale_btn_path);
        this.Set_Event_In_Btn(plant, event, plant.rotate_btn_path);
        this.Set_Event_In_Btn(plant, event, plant.move_btn_path);
        this.Set_Event_In_Btn(plant, event, plant.time_btn_path);
        if (plant.scale_btn_path.hover || plant.rotate_btn_path.hover || 
          plant.move_btn_path.hover || plant.time_btn_path.hover)
        {
          res = plant;
          break;
        }
      }
    }

    return res;
  }

  Set_Event_In_Btn(plant, event, path)
  {
    this.ctx.save();

    this.Transform_To_Btn(path, plant);
    path.hover = this.ctx.isPointInPath(path, event.offsetX, event.offsetY);
    
    this.ctx.restore();
  }

  Transform_To_Btn(path, plant)
  {
    if (path.relative)
    {
      this.ctx.translate(plant.x, plant.y);
      this.ctx.rotate(plant.angle);
      this.ctx.scale(plant.x_scale, plant.y_scale);

      this.ctx.translate(path.x, path.y);
      // undo plant scaling
      this.ctx.scale(1/plant.x_scale, 1/plant.y_scale);
    }
    else
    {
      this.ctx.translate(path.x, path.y);
    }
  }

  // Events =======================================================================================

  OnFinish_Play()
  {
    this.is_playing = false;
    if (this.on_finish_play_fn)
    {
      this.on_finish_play_fn();
    }
  }

  OnMouseMove_Canvas(event)
  {
    let plant, do_render, c_pt;

    plant = this.Get_MouseEvent_Plant(event);
    if (plant)
    {
      do_render = true;
    }

    c_pt = this.To_Canvas_Pt(event.offsetX, event.offsetY);
    if (this.move_plant)
    {
      this.move_plant.x = c_pt.x;
      this.move_plant.y = c_pt.y;
      do_render = true;
    }
    if (this.scale_plant)
    {
      const m = new DOMMatrix();
      m.translateSelf(this.scale_plant.x, this.scale_plant.y);
      m.rotateSelf(this.To_Degrees(this.scale_plant.angle));
      m.invertSelf();
      const p = new DOMPoint(c_pt.x, c_pt.y);
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
      const p = new DOMPoint(c_pt.x, c_pt.y);
      const tp = p.matrixTransform(m);
      this.rotate_plant.angle = Math.atan2(tp.y, tp.x) - (Math.PI/2);
      this.rotate_plant.angle = this.rotate_plant.angle * (x_sign*y_sign);
      do_render = true;
    }
    if (this.time_plant)
    {
      this.time_plant.sprout_time = this.time_plant.time_btn_path.y / 10;
      const trunk_pt_idx = Math.trunc(this.time_plant.sprout_time);
      this.time_plant.time_btn_path.x = this.trunk_pts[trunk_pt_idx].x;
      this.time_plant.time_btn_path.y = c_pt.y;
      do_render = true;
    }

    if (do_render)
    {
      this.Render_Plants();
    }
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
    if (plant && plant.time_btn_path.hover)
    {
      this.time_plant = plant;
    }
  }

  OnMouseUp_Canvas(event)
  {
    let plant, trunk_pt_idx;

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
    if (this.time_plant)
    {
      plant = this.time_plant;
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
    this.time_plant = null;

    if (this.on_change_fn)
    {
      this.on_change_fn(plant);
    }
  }

  // Gfx ==========================================================================================
  
  Render_Crosshairs(c_pt)
  {
    this.ctx.lineWidth = 1;
    this.ctx.beginPath()
    this.ctx.moveTo(c_pt.x-10, c_pt.y);
    this.ctx.lineTo(c_pt.x+10, c_pt.y);
    this.ctx.moveTo(c_pt.x, c_pt.y-10);
    this.ctx.lineTo(c_pt.x, c_pt.y+10);
    this.ctx.stroke();
  }

  Clr()
  {
    this.ctx.clearRect(-this.canvas.width/2, 0, this.canvas.width, this.canvas.height);
  }

  Init_Btns(plant, pot_size)
  {
    let btn_size = 12, x, y;

    // scale btn
    if (!plant.scale_btn_path)
    {
      x = (pot_size/2);
      y = (pot_size/2);
      plant.scale_btn_path = this.New_Btn_Path(x, y, btn_size, true, "scl_btn");
    }

    // rotate btn
    if (!plant.rotate_btn_path)
    {
      y = (pot_size/2);
      x = 0;
      plant.rotate_btn_path = this.New_Btn_Path(x, y, btn_size, true, "rot_btn");
    }

    // translate btn
    if (!plant.move_btn_path)
    {
      x = 0;
      y = 0;
      plant.move_btn_path = this.New_Btn_Path(x, y, btn_size, true, "trn_btn");
    }

    // sprout time btn
    if (!plant.time_btn_path)
    {
      plant.sprout_time = plant.y / 10;
      const trunk_pt_idx = Math.trunc(plant.sprout_time);
      x = this.trunk_pts[trunk_pt_idx].x;
      y = this.trunk_pts[trunk_pt_idx].y;
      plant.time_btn_path = this.New_Btn_Path(x, y, btn_size, false, "spr_btn");
    }
  }

  New_Btn_Path(x, y, size, relative, id)
  {
    let btn_path;

    btn_path = new Path2D();
    btn_path.colour = "#000";
    btn_path.colour_hover = "#0f0";
    btn_path.hover = false;
    btn_path.rect(-0.5*size, -0.5*size, size, size);
    btn_path.x = x;
    btn_path.y = y;
    btn_path.size = size;
    btn_path.relative = relative;
    btn_path.id = id;

    return btn_path;
  }

  Render_Plants()
  {
    let plant;

    this.Clr();
    this.Render_Trunk();

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        this.Render_Plant(plant);
      }
    }
  }

  Render_Trunk()
  {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeStyle="#aaa";

    this.ctx.moveTo(this.trunk_pts[0].x, this.trunk_pts[0].y);
    for (let i=1; i<this.trunk_pts.length; i++)
    {
      this.ctx.lineTo(this.trunk_pts[i].x, this.trunk_pts[i].y);
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  Render_Plant(plant)
  {
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
    const r = pot_size/2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(-r, -r);
    this.ctx.lineTo(-r, r);
    this.ctx.lineTo(r, r);
    this.ctx.lineTo(r, -r);
    this.ctx.lineTo(-r, -r);
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, 3*r);
    this.ctx.stroke();

    this.ctx.restore();

    this.Render_Btn(plant, plant.scale_btn_path);
    this.Render_Btn(plant, plant.rotate_btn_path);
    this.Render_Btn(plant, plant.move_btn_path);
    this.Render_Btn(plant, plant.time_btn_path);
  }

  Render_Btn(plant, path)
  {
    this.ctx.save();
    this.Transform_To_Btn(path, plant);

    if (path.hover)
    {
      this.ctx.fillStyle = path.colour_hover;
    }
    else
    {
      this.ctx.fillStyle = path.colour;
    }
    this.ctx.fill(path);

    this.ctx.restore();
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

customElements.define('sprout-editor', Sprout_Editor);

// Plant Def ======================================================================================

function Get_Trunk_Pts()
{
  var x1, y1, x2, y2, cx1, cy1, cx2, cy2;

  x1 = 0; y1 = 0;
  x2 = 0; y2 = 1000;

  cy1 = 200; cx1 = -250;
  cy2 = 800; cx2 = 250;

  const curve = new Bezier(
    x1, y1, cx1, cy1,
    cx2, cy2, x2, y2);

  return curve.getLUT(100);
}

class Plant extends pl.Plant_Maturing2
{
  Init_Trunk()
  {
    this.curve_pts = Get_Trunk_Pts();
  }

  Init_Branches()
  {
    let sprout;
    
    if (this.sprouts && this.sprouts.length>0)
    {
      for (let i=0; i<this.sprouts.length; i++)
      {
        sprout = this.sprouts[i];
        this.Add_Plant(sprout.sprout_time, sprout.angle, new pl[sprout.class_name], 
          sprout.x_scale, sprout.y_scale,
          sprout.x, sprout.y);
      }
    }
  }

  Add_Plant(sprout_time, angle, plant, x_scale, y_scale, x, y)
  {
    if (this.curr_depth < this.max_depth)
    {
      plant.sprout_time = sprout_time;
      plant.render = false;
      plant.x = x;
      plant.y = y;
      plant.x_scale = x_scale;
      plant.y_scale = y_scale;
      plant.angle = angle;
      plant.maturity_rate = this.maturity_rate;
      this.Add_Branch(plant);
    }
  }

  Render()
  {
    var c;

    for (c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = (this.maturity - c) / 10;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }
}

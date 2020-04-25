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
    this.is_playing = false;
    this.on_finish_play_fn = null;
    this.colour = "#aaa";
    this.colour_selected = "#000";
    this.btn_size = 12;
    this.active_plant = null;
    this.cmd = null;

    this.time_btn_path = null;
    this.move_btn_path = null;
    this.rotate_btn_path = null;
    this.scale_btn_path = null;
    this.pt1_btn = this.New_Btn_Path(0, 0, 12, false, "pt1");
    this.pt2_btn = this.New_Btn_Path(0, 1000, 12, false, "pt2");
    this.ctrl1_btn = this.New_Btn_Path(-250, 200, 12, false, "ctrl1");
    this.ctrl2_btn = this.New_Btn_Path(250, 800, 12, false, "ctrl2");
    this.Update_Trunk();

    this.OnMouseMove_Canvas = this.OnMouseMove_Canvas.bind(this);
    this.OnMouseDown_Canvas = this.OnMouseDown_Canvas.bind(this);
    this.OnMouseUp_Canvas = this.OnMouseUp_Canvas.bind(this);
    this.Render_Plants = this.Render_Plants.bind(this);
    this.OnFinish_Play = this.OnFinish_Play.bind(this);
  }
  
  firstUpdated(changedProperties)
  {
    this.canvas = this.shadowRoot.getElementById("main_canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.translate(this.canvas.width/2, this.canvas.height);
    this.ctx.scale(1, -1);
    this.Render_Plants();
    this.Enable_Events();
  }

  Play(on_finish_play_fn)
  {
    this.is_playing = true;
    this.on_finish_play_fn = on_finish_play_fn;

    const plant = new Plant();
    plant.pt1 = {x: this.pt1_btn.x, y: this.pt1_btn.y};
    plant.pt2 = {x: this.pt2_btn.x, y: this.pt2_btn.y};
    plant.ctrl1 = {x: this.ctrl1_btn.x, y: this.ctrl1_btn.y};
    plant.ctrl2 = {x: this.ctrl2_btn.x, y: this.ctrl2_btn.y};
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

    this.Disable_Events();
    this.ctx.setLineDash([]);
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "#000";

    this.Clr();
    pl.Animate(this.ctx, [plant], this.OnFinish_Play, this.Render_Plants);
  }

  Disable_Events()
  {
    this.canvas.removeEventListener('mousemove', this.OnMouseMove_Canvas);
    this.canvas.removeEventListener('mousedown', this.OnMouseDown_Canvas);
    this.canvas.removeEventListener('mouseup', this.OnMouseUp_Canvas);
  }

  Enable_Events()
  {
    this.canvas.addEventListener('mousemove', this.OnMouseMove_Canvas);
    this.canvas.addEventListener('mousedown', this.OnMouseDown_Canvas);
    this.canvas.addEventListener('mouseup', this.OnMouseUp_Canvas);
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

  Set_MouseEvents(event)
  {
    let plant, i, res = false;

    if (this.plants && this.plants.length>0)
    {
      for (i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        if (this.Set_Event_In_Btn(plant, event, plant.scale_btn_path) ||
          this.Set_Event_In_Btn(plant, event, plant.rotate_btn_path) ||
          this.Set_Event_In_Btn(plant, event, plant.move_btn_path) ||
          this.Set_Event_In_Btn(plant, event, plant.time_btn_path))
        {
          this.active_plant = plant;
          res = true;
        }
      }
    }

    res = res || this.Set_Event_In_Btn(null, event, this.pt1_btn);
    res = res || this.Set_Event_In_Btn(null, event, this.pt2_btn);
    res = res || this.Set_Event_In_Btn(null, event, this.ctrl1_btn);
    res = res || this.Set_Event_In_Btn(null, event, this.ctrl2_btn);

    return res;
  }

  Set_Event_In_Btn(plant, event, path)
  {
    this.ctx.save();

    this.Transform_To_Btn(path, plant);
    path.hover = this.ctx.isPointInPath(path, event.offsetX, event.offsetY);
    
    this.ctx.restore();

    return path.hover;
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

  Update_Trunk()
  {
    this.trunk_pts = Get_Trunk_Pts
      (this.pt1_btn.x, this.pt1_btn.y,
      this.pt2_btn.x, this.pt2_btn.y,
      this.ctrl1_btn.x, this.ctrl1_btn.y,
      this.ctrl2_btn.x, this.ctrl2_btn.y);
  }

  Design_Mode()
  {
    this.Render_Plants();
    this.Enable_Events();
  }

  Set_Time_Btn_Pts()
  {
    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        const plant = this.plants[i];
        this.Set_Sprout_Time(plant, plant.sprout_time);
      }
    }
  }

  Set_Sprout_Time(plant, sprout_time)
  {
    plant.sprout_time = sprout_time;
    const trunk_pt_idx = Math.trunc(plant.sprout_time+0.5);
    if (trunk_pt_idx < 0)
    {
      trunk_pt_idx = 0;
    }
    else if (trunk_pt_idx >= this.trunk_pts.length)
    {
      trunk_pt_idx = this.trunk_pts.length -1;
    }
    plant.time_btn_path.x = this.trunk_pts[trunk_pt_idx].x;
    plant.time_btn_path.y = this.trunk_pts[trunk_pt_idx].y;
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

  OnMouseDown_Canvas(event)
  {
    if (this.Set_MouseEvents(event))
    {
      if (this.active_plant)
      {
        if (this.active_plant.move_btn_path.hover)
        {
          this.cmd = {id: "move_plant", plant: this.active_plant};
        }
        if (this.active_plant.scale_btn_path.hover)
        {
          this.cmd = {id: "scale_plant", plant: this.active_plant};
        }
        if (this.active_plant.rotate_btn_path.hover)
        {
          this.cmd = {id: "rotate_plant", plant: this.active_plant};
        }
        if (this.active_plant.time_btn_path.hover)
        {
          this.cmd = {id: "time_plant", plant: this.active_plant};
        }
      }
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
      this.Render_Plants();
    }
  }

  OnMouseMove_Canvas(event)
  {
    let c_pt;

    this.Set_MouseEvents(event);
    if (this.cmd)
    {
      c_pt = this.To_Canvas_Pt(event.offsetX, event.offsetY);
      if (this.cmd.id == "move_plant")
      {
        this.cmd.plant.x = c_pt.x;
        this.cmd.plant.y = c_pt.y;
      }
      if (this.cmd.id == "scale_plant")
      {
        const m = new DOMMatrix();
        m.translateSelf(this.cmd.plant.x, this.cmd.plant.y);
        m.rotateSelf(this.To_Degrees(this.cmd.plant.angle));
        m.invertSelf();
        const p = new DOMPoint(c_pt.x, c_pt.y);
        const tp = p.matrixTransform(m);
        this.cmd.plant.x_scale = tp.x / (pot_size/2);
        this.cmd.plant.y_scale = tp.y / (pot_size/2);
      }
      if (this.cmd.id == "rotate_plant")
      {
        const x_sign = Math.sign(this.cmd.plant.x_scale);
        const y_sign = Math.sign(this.cmd.plant.y_scale);
        const m = new DOMMatrix();
        m.translateSelf(this.cmd.plant.x, this.cmd.plant.y);
        m.scaleSelf(x_sign, y_sign);
        m.invertSelf();
        const p = new DOMPoint(c_pt.x, c_pt.y);
        const tp = p.matrixTransform(m);
        this.cmd.plant.angle = Math.atan2(tp.y, tp.x) - (Math.PI/2);
        this.cmd.plant.angle = this.cmd.plant.angle * (x_sign*y_sign);
      }
      if (this.cmd.id == "time_plant")
      {
        this.Set_Sprout_Time(this.cmd.plant, c_pt.y / 10);
      }
      if (this.cmd.id == "pt1")
      {
        this.pt1_btn.x = c_pt.x;
        this.pt1_btn.y = c_pt.y;
      }
      if (this.cmd.id == "pt2")
      {
        this.pt2_btn.x = c_pt.x;
        this.pt2_btn.y = c_pt.y;
      }
      if (this.cmd.id == "ctrl1")
      {
        this.ctrl1_btn.x = c_pt.x;
        this.ctrl1_btn.y = c_pt.y;
      }
      if (this.cmd.id == "ctrl2")
      {
        this.ctrl2_btn.x = c_pt.x;
        this.ctrl2_btn.y = c_pt.y;
      }
    }
    this.Render_Plants();
  }

  OnMouseUp_Canvas(event)
  {
    if (this.cmd)
    {
      if (this.cmd.id == "pt1" || this.cmd.id == "pt2" || this.cmd.id == "ctrl1" || this.cmd.id == "ctrl2")
      {
        this.Update_Trunk();
        this.Set_Time_Btn_Pts();
      }
      if (this.cmd.plant)
      {
        this.plants.forEach((plant) => plant.selected = false);
        this.cmd.plant.selected = true;
      }

      if (this.on_change_fn)
      {
        this.on_change_fn(this.cmd.plant);
      }
      this.Render_Plants();
      this.cmd = null;
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
    let x, y;

    // scale btn
    if (!plant.scale_btn_path)
    {
      x = (pot_size/2);
      y = (pot_size/2);
      plant.scale_btn_path = this.New_Btn_Path(x, y, this.btn_size, true, "scl_btn");
    }

    // rotate btn
    if (!plant.rotate_btn_path)
    {
      y = (pot_size/2);
      x = 0;
      plant.rotate_btn_path = this.New_Btn_Path(x, y, this.btn_size, true, "rot_btn");
    }

    // translate btn
    if (!plant.move_btn_path)
    {
      x = 0;
      y = 0;
      plant.move_btn_path = this.New_Btn_Path(x, y, this.btn_size, true, "trn_btn");
    }

    // sprout time btn
    if (!plant.time_btn_path)
    {
      plant.time_btn_path = this.New_Btn_Path(x, y, this.btn_size, false, "spr_btn");
      this.Set_Sprout_Time(plant, plant.y / 10);
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
    this.ctx.save();
    this.Render_Trunk();
    this.ctx.restore();

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        this.Render_Plant(plant);
      }
    }

    this.Render_Btn(null, this.pt1_btn);
    this.Render_Btn(null, this.pt2_btn);
    this.Render_Btn(null, this.ctrl1_btn, this.pt1_btn.x, this.pt1_btn.y);
    this.Render_Btn(null, this.ctrl2_btn, this.pt2_btn.x, this.pt2_btn.y);
  }

  Render_Trunk()
  {
    this.ctx.beginPath();
    this.ctx.setLineDash([]);
    this.ctx.strokeStyle="#aaa";
    this.ctx.moveTo(this.trunk_pts[0].x, this.trunk_pts[0].y);
    for (let i=1; i<this.trunk_pts.length; i++)
    {
      this.ctx.lineTo(this.trunk_pts[i].x, this.trunk_pts[i].y);
    }
    this.ctx.stroke();
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
      this.ctx.lineWidth = 3;
    }
    else
    {
      this.ctx.strokeStyle = this.colour;
      this.ctx.lineWidth = 1;
    }
    const r = pot_size/2;
    this.ctx.setLineDash([]);
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
    this.Render_Btn(plant, plant.time_btn_path, plant.x, plant.y);
  }

  Render_Btn(plant, path, x, y)
  {
    if (x != null && y != null)
    {
      this.ctx.setLineDash([5, 5]);
      this.ctx.strokeStyle="#aaa";
      this.ctx.beginPath();
      this.ctx.moveTo(path.x, path.y);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }

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

function Get_Trunk_Pts(x1, y1, x2, y2, cx1, cy1, cx2, cy2)
{
  const curve = new Bezier(
    x1, y1, cx1, cy1,
    cx2, cy2, x2, y2);

  return curve.getLUT(100);
}

class Plant extends pl.Plant_Maturing2
{
  Init_Trunk()
  {
    this.curve_pts = Get_Trunk_Pts
      (this.pt1.x, this.pt1.y,
      this.pt2.x, this.pt2.y,
      this.ctrl1.x, this.ctrl1.y,
      this.ctrl2.x, this.ctrl2.y);
  }

  Init_Branches()
  {
    let sprout;
    
    if (this.sprouts && this.sprouts.length>0)
    {
      for (let i=0; i<this.sprouts.length; i++)
      {
        sprout = this.sprouts[i];
        this.Add_Plant_Abs(sprout.sprout_time, sprout.angle, new pl[sprout.class_name], 
          sprout.x_scale, sprout.y_scale,
          sprout.x, sprout.y);
      }
    }
  }

  Render()
  {
    for (let c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = (this.maturity - c) / 10;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }
}

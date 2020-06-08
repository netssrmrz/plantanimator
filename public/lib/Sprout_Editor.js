import {LitElement, html, css} from "./lit-element/lit-element.js";
import * as pl from "./pa.js";
import { Bezier } from "./bezierjs/bezier.js";

const pot_size = 100;

// Plant Def ======================================================================================

function Get_Trunk_Pts(x1, y1, x2, y2, cx1, cy1, cx2, cy2)
{
  const curve = new Bezier(
    x1, y1, cx1, cy1,
    cx2, cy2, x2, y2);

  return curve.getLUT(100);
}

class Plant extends pl.Base_Plant_Maturing2
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
    let sprout, plant;
    
    if (this.sprouts && this.sprouts.length>0)
    {
      for (let i=0; i<this.sprouts.length; i++)
      {
        sprout = this.sprouts[i];

        if (sprout.class_name == "This")
        {
          plant = new Plant();
          plant.pt1 = this.pt1;
          plant.pt2 = this.pt2;
          plant.ctrl1 = this.ctrl1;
          plant.ctrl2 = this.ctrl2;
          plant.sprouts = this.sprouts;
        }
        else
        {
          plant = new pl[sprout.class_name];
        }

        this.Add_Plant_Abs(sprout.sprout_time, sprout.angle, plant, 
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

// Editor Def ======================================================================================

class Sprout_Editor extends LitElement
{
  constructor()
  {
    super();
    this.plants = null;
    this.is_playing = false;
    this.on_finish_play_fn = null;
    this.this_class = Plant;

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
    this.Init_Canvas(1, 1000, 1000);
    //this.ctx.translate(this.canvas.width/2, this.canvas.height);
    //this.ctx.scale(1, -1);
    this.Render_Plants();
    this.Enable_Events();
  }

  Init_Canvas(zoom, width, height)
  {
    this.canvas.width = width;
    this.canvas.height = height;        
    this.ctx.x_scale = zoom;
    this.ctx.y_scale = zoom;

    this.ctx.globalCompositeOperation = "difference";
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
    this.ctx.scale(zoom, -zoom);
    this.ctx.strokeStyle="#000";
    this.ctx.fillStyle="#000";
    this.ctx.lineWidth = 1;
  }

  Play_Plant(on_finish_play_fn)
  {
    this.is_playing = true;
    this.on_finish_play_fn = on_finish_play_fn;
    this.Disable_Events();

    const stem = this.plants.find((p) => p.name=="Stem");

    const plant = new Plant();
    plant.pt1 = {x: stem.x1, y: stem.y1};
    plant.pt2 = {x: stem.x2, y: stem.y2};
    plant.ctrl1 = {x: stem.ctrl1_x, y: stem.ctrl1_y};
    plant.ctrl2 = {x: stem.ctrl2_x, y: stem.ctrl2_y};
    plant.sprouts = this.plants.filter((p) => p.name!="Stem");
    plant.maturity_rate = 1;
    plant.maturity = 0;
    plant.x = 0;
    plant.y = 0;
    plant.x_scale = 1;
    plant.y_scale = 1;
    plant.angle = 0;
    plant.canvas_ctx = this.ctx;

    this.ctx.setLineDash([]);
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "#000";

    this.Clr(this.ctx);
    pl.Animate(this.ctx, [plant], this.OnFinish_Play, this.Render_Plants, this.Clr);
  }

  Play_Scene(on_finish_play_fn)
  {
    let plant; 
    this.is_playing = true;
    this.on_finish_play_fn = on_finish_play_fn;
    this.Disable_Events();

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        plant.Reset();
      }
      this.Clr(this.ctx);
      pl.Animate(this.ctx, this.plants, this.OnFinish_Play, this.Render_Plants, this.Clr);
    }
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
      this.Enable_Events();
    }
  }

  Design_Mode()
  {
    this.Render_Plants();
    this.Enable_Events();
  }

  Resize(width, height)
  {
    this.style.width = width + "px";
    this.style.height = height + "px";
    this.Init_Canvas(this.ctx.x_scale, width-40, height-40);
    this.Render_Plants();
  }

  Update()
  {
    this.Render_Plants();
  }

  // Events =======================================================================================

  OnFinish_Play()
  {
    this.is_playing = false;
    if (this.on_finish_play_fn)
    {
      this.on_finish_play_fn();
    }
    this.Enable_Events();
  }

  OnMouseDown_Canvas(event)
  {
    let plant;

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        if (plant.On_Mouse_Down)
        {
          plant.On_Mouse_Down(event, this.ctx);
        }
      }
      this.Render_Plants();
    }
  }

  OnMouseMove_Canvas(event)
  {
    let c_pt, plant;

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        if (plant.On_Mouse_Move)
        {
          plant.On_Mouse_Move(event, this.ctx);
        }
      }
      this.Render_Plants();
    }
  }

  OnMouseUp_Canvas(event)
  {
    let plant, has_change;

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];
        if (plant.On_Mouse_Up)
        {
          has_change = plant.On_Mouse_Up(event, this.ctx);
          if (has_change && this.on_change_fn)
          {
            this.on_change_fn(plant);
          }
        }
        this.Render_Plants();
      }
    }
  }

  // Gfx ==========================================================================================
  
  Clr(ctx)
  {
    ctx.clearRect(-ctx.canvas.width/2, -ctx.canvas.height/2, ctx.canvas.width, ctx.canvas.height);
  }

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

  Render_Plants()
  {
    let plant;

    this.Clr(this.ctx);

    if (this.plants && this.plants.length>0)
    {
      for (let i=0; i<this.plants.length; i++)
      {
        plant = this.plants[i];

        this.ctx.save();
        this.ctx.translate(plant.x, plant.y);
        this.ctx.rotate(plant.angle);
        this.ctx.scale(plant.x_scale, plant.y_scale);
        if (plant.Render_Design)
          plant.Render_Design(this.ctx);
        this.ctx.restore();

        if (plant.Render_Design_Abs)
          plant.Render_Design_Abs(this.ctx);
      }
    }
  }

  static get styles()
  {
    return css`
      :host
      {
        display: inline-block;
        xborder: 1px solid #f00;
        overflow: hidden;
        position: absolute;
        left: 0px;
        bottom: 0px;
        z-index: 0;
      }
      canvas
      {
        border: 0;
        box-shadow: 
          0px 0px 0px 1px rgb(0,0,0), 
          0px 0px 0px 4px rgb(255, 255, 255), 
          0px 0px 0px 7px rgb(0, 0, 0);
        margin: 17px;
        padding: 3px;   
      }
    `;
  }

  render()
  {
    return html`<canvas id="main_canvas" width="1000" height="1000"></canvas><div id="debug"></div>`;
  }
}

customElements.define('sprout-editor', Sprout_Editor);

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

class Shape_Editor extends LitElement
{
  constructor()
  {
    super();
    this.shapes = null;
    //this.is_playing = false;
    //this.on_finish_play_fn = null;
    //this.this_class = Plant;

    this.OnMouseMove_Canvas = this.OnMouseMove_Canvas.bind(this);
    //this.OnMouseDown_Canvas = this.OnMouseDown_Canvas.bind(this);
    //this.OnMouseUp_Canvas = this.OnMouseUp_Canvas.bind(this);
    this.Render = this.Render.bind(this);
    //this.OnFinish_Play = this.OnFinish_Play.bind(this);
  }
  
  firstUpdated(changedProperties)
  {
    this.canvas = this.shadowRoot.getElementById("main_canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
    this.ctx.scale(1, -1);
    this.ctx.strokeStyle="#000";
    this.ctx.lineWidth = 1;
    //this.Render_Plants();
    this.Enable_Events();
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
    //this.canvas.removeEventListener('mousedown', this.OnMouseDown_Canvas);
    //this.canvas.removeEventListener('mouseup', this.OnMouseUp_Canvas);
  }

  Enable_Events()
  {
    this.canvas.addEventListener('mousemove', this.OnMouseMove_Canvas);
    //this.canvas.addEventListener('mousedown', this.OnMouseDown_Canvas);
    //this.canvas.addEventListener('mouseup', this.OnMouseUp_Canvas);
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

  Set_Shapes(shapes)
  {
    this.shapes = shapes;
    this.Render(this.ctx, shapes);
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

  OnMouseMove_Canvas(event)
  {
    let shape;

    if (this.shapes && this.shapes.length>0)
    {
      for (let i=0; i<this.shapes.length; i++)
      {
        shape = this.shapes[i];
        if (shape.On_Mouse_Move)
        {
          shape.On_Mouse_Move(event, this.ctx);
        }
      }
      this.Render(this.ctx, this.shapes);
    }
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

  Render(ctx, shapes)
  {
    let shape;

    this.Clr(ctx);

    if (shapes && shapes.length>0)
    {
      ctx.beginPath();
      for (let i=0; i<shapes.length; i++)
      {
        shape = shapes[i];

        //ctx.save();
        //ctx.translate(plant.x, plant.y);
        //ctx.rotate(plant.angle);
        //ctx.scale(plant.x_scale, plant.y_scale);
        //if (plant.Render_Design)
          //plant.Render_Design(ctx);
        //ctx.restore();

        if (shape.Render)
          shape.Render(ctx);
      }
      ctx.stroke();
    }
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

customElements.define('shape-editor', Shape_Editor);

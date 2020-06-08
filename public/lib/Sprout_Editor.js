import * as pl from "./pa.js";
import { Bezier } from "./bezierjs/bezier.js";
import Canvas_Editor from "./Canvas_Editor.js";

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

//class Sprout_Editor extends LitElement
class Sprout_Editor extends Canvas_Editor
{
  constructor()
  {
    super();
    this.is_playing = false;
    this.on_finish_play_fn = null;
    this.this_class = Plant;

    this.OnFinish_Play = this.OnFinish_Play.bind(this);
  }

  Play_Plant(on_finish_play_fn)
  {
    this.is_playing = true;
    this.on_finish_play_fn = on_finish_play_fn;
    this.Disable_Events();

    const stem = this.shapes.find((p) => p.name=="Stem");

    const plant = new Plant();
    plant.pt1 = {x: stem.x1, y: stem.y1};
    plant.pt2 = {x: stem.x2, y: stem.y2};
    plant.ctrl1 = {x: stem.ctrl1_x, y: stem.ctrl1_y};
    plant.ctrl2 = {x: stem.ctrl2_x, y: stem.ctrl2_y};
    plant.sprouts = this.shapes.filter((p) => p.name!="Stem");
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
    pl.Animate(this.ctx, [plant], this.OnFinish_Play, this.Update, this.Clr);
  }

  Play_Scene(on_finish_play_fn)
  {
    let plant; 
    this.is_playing = true;
    this.on_finish_play_fn = on_finish_play_fn;
    this.Disable_Events();

    if (this.shapes && this.shapes.length>0)
    {
      for (let i=0; i<this.shapes.length; i++)
      {
        plant = this.shapes[i];
        plant.Reset();
      }
      this.Clr(this.ctx);
      pl.Animate(this.ctx, this.shapes, this.OnFinish_Play, this.Update, this.Clr);
    }
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
    this.Update();
    this.Enable_Events();
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

  // Gfx ==========================================================================================

  Render(ctx, shapes)
  {
    let plant;

    this.Clr(ctx);

    if (shapes && shapes.length>0)
    {
      for (let i=0; i<shapes.length; i++)
      {
        plant = shapes[i];

        ctx.save();
        ctx.translate(plant.x, plant.y);
        ctx.rotate(plant.angle);
        ctx.scale(plant.x_scale, plant.y_scale);
        if (plant.Render_Design)
          plant.Render_Design(ctx);
        ctx.restore();

        if (plant.Render_Design_Abs)
          plant.Render_Design_Abs(ctx);
      }
    }
  }
}

customElements.define('sprout-editor', Sprout_Editor);

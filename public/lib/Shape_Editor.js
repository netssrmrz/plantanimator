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
    this.paint_style = "stroke";
    this.shapes = null;
    this.OnMouseMove_Canvas = this.OnMouseMove_Canvas.bind(this);
    this.OnMouseDown_Canvas = this.OnMouseDown_Canvas.bind(this);
    this.OnMouseUp_Canvas = this.OnMouseUp_Canvas.bind(this);
    this.Render = this.Render.bind(this);
  }
  
  firstUpdated(changedProperties)
  {
    this.canvas = this.shadowRoot.getElementById("main_canvas");
    this.ctx = this.canvas.getContext("2d");
    this.Init_Canvas(1000, 1000);
    this.Enable_Events();
  }

  Init_Canvas(w, h)
  {
    this.ctx.globalCompositeOperation = "difference";
    this.ctx.x_scale = 1000/w;
    this.ctx.y_scale = 1000/h;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
    this.ctx.scale(this.ctx.x_scale, -this.ctx.y_scale);
    this.ctx.strokeStyle="#000";
    this.ctx.lineWidth = 1;
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

  Set_Shapes(shapes)
  {
    this.shapes = shapes;
    this.Render(this.ctx, shapes);
  }

  Set_Size(w, h)
  {
    this.Init_Canvas(w, h);
    this.Render(this.ctx, this.shapes);
  }

  Set_Paint(paint_style)
  {
    this.paint_style = paint_style;
    this.Render(this.ctx, this.shapes);
  }

  // Events =======================================================================================

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
    let shape;

    if (this.shapes && this.shapes.length>0)
    {
      for (let i=0; i<this.shapes.length; i++)
      {
        shape = this.shapes[i];
        if (shape.On_Mouse_Down)
        {
          shape.On_Mouse_Down(event, this.ctx);
        }
      }
      this.Render(this.ctx, this.shapes);
    }
  }

  OnMouseUp_Canvas(event)
  {
    let shape, has_change;

    if (this.shapes && this.shapes.length>0)
    {
      for (let i=0; i<this.shapes.length; i++)
      {
        shape = this.shapes[i];
        if (shape.On_Mouse_Up)
        {
          has_change = shape.On_Mouse_Up(event, this.ctx);
          if (has_change && this.on_change_fn)
          {
            this.on_change_fn(shape);
          }
        }
        this.Render(this.ctx, this.shapes);
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
      ctx.save();
      ctx.beginPath();
      for (let i=0; i<shapes.length; i++)
      {
        shape = shapes[i];
        if (shape.Render)
          shape.Render(ctx);
      }
      if (this.paint_style == "stroke")
      {
        ctx.stroke();
      }
      else
      {
        ctx.fill();
      }
      ctx.restore();

      this.Render_Design(ctx, shapes);
    }
  }

  Render_Design(ctx, shapes)
  {
    let shape;

    for (let i=0; i<shapes.length; i++)
    {
      shape = shapes[i];
      if (shape.selected && shape.Render_Design)
        shape.Render_Design(ctx);
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
        width: 1000px;
        height: 1000px;   
      }
    `;
  }

  render()
  {
    return html`<canvas id="main_canvas" width="1000" height="1000"></canvas>`;
  }
}

customElements.define('shape-editor', Shape_Editor);

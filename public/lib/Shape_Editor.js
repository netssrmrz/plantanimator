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
    this.debug = this.shadowRoot.getElementById("debug");
    this.ctx = this.canvas.getContext("2d");
    this.Init_Canvas(1, 1000, 1000);
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

  Set_Zoom(zoom)
  {
    this.Init_Canvas(zoom, this.canvas.width, this.canvas.height);
    this.Render(this.ctx, this.shapes);
  }

  Set_Paint(paint_style)
  {
    this.paint_style = paint_style;
    this.Render(this.ctx, this.shapes);
  }

  Resize(width, height)
  {
    this.style.width = width + "px";
    this.style.height = height + "px";
    this.Init_Canvas(this.ctx.x_scale, width-40, height-40);
    this.Render(this.ctx, this.shapes);
  }

  // Events =======================================================================================

  OnMouseMove_Canvas(event)
  {
    let shape;

    //this.debug.innerText = "x, y = " + event.offsetX + ", " + event.offsetY;
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
    this.Render_Origin(ctx);
  }

  Render_Origin(ctx)
  {
    ctx.save();
    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 1;
    //ctx.setLineDash([5, 5]);

    const rx = this.canvas.width/2;
    const ry = this.canvas.height/2;
    ctx.beginPath();
    ctx.moveTo(-rx, 0);
    ctx.lineTo(rx, 0);
    ctx.moveTo(0, -ry);
    ctx.lineTo(0, ry);
    ctx.stroke();

    //ctx.setLineDash([]);
    ctx.restore();
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

customElements.define('shape-editor', Shape_Editor);

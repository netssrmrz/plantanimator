import {LitElement, html, css} from "./lit-element/lit-element.js";

// Editor Def ======================================================================================

class Canvas_Editor extends LitElement
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

  Update()
  {
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
      this.Update();
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
      this.Update();
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
        this.Update();
      }
    }
  }

  // Gfx ==========================================================================================
  
  Clr(ctx)
  {
    ctx.clearRect(-ctx.canvas.width/2, -ctx.canvas.height/2, ctx.canvas.width, ctx.canvas.height);
  }

  Render(ctx, shapes)
  {
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

customElements.define('canvas-editor', Canvas_Editor);
export default Canvas_Editor;
import {LitElement, html, css} from "./lit-element/lit-element.js";
import * as pl from "./pa.js";
import { Bezier } from "./bezierjs/bezier.js";

class Android_Code_Gen extends LitElement 
{
  constructor()
  {
    super();
  }

  Hide()
  {
    this.style.display = "none";
  }

  Show()
  {
    this.style.display = "block";
  }

  Gen_Code(shapes)
  {
    let code;

    const data = this.Gen_Cmds(shapes);
    code = 
      "public class Shape implements Is_Drawable\n" +
      "{\n" +
        "\tpublic static java.nio.FloatBuffer points = Context.New_Buffer(Get_Points());\n" +
        "\n" +
    
        "\tpublic static float[] Get_Points()\n" +
        "\t{\n" +
          "\t\tfloat[] points=\n" +
          "\t\t{\n" +
          this.Gen_Points(data.points) +
          "\t\t};\n" +
          "\n" +
          "\t\treturn points;\n" +
        "\t};\n" +
        "\n" +
    
        "\tpublic java.nio.FloatBuffer Get_Points_Buffer()\n" +
        "\t{\n" +
          "\t\treturn this.points;\n" +
        "\t};\n" +
        "\n" +

        "\tpublic void Draw(Context ctx)\n" +
        "\t{\n" +
          this.Gen_Segments(data.segments) +
        "\t}\n" +
      "}\n";

    this.shadowRoot.getElementById("txt_area").value = code;
  }

  Gen_Segments(segments)
  {
    let res = "", segment, i;

    if (segments && segments.length>0)
    {
      for (i=0; i<segments.length; i++)
      {
        segment = segments[i];
        res += "\t\tandroid.opengl.GLES20.glDrawArrays(" + 
          segment.mode + ", " + segment.pt_start + ", " + segment.pt_count + ");\n";
      }
    }

    return res;
  }

  Gen_Points(points)
  {
    let res = "", i;

    if (points && points.length>0)
    {
      for (i=0; i<points.length; i++)
      {
        res = pl.Append_Str(res, points[i] + "f", ", ");
        if ((i+1)%10 == 0)
        {
          res+= "\n\t\t\t";
        }
      }
      res = "\t\t\t" + res + "\n";
    }

    return res;
  }

  Gen_Cmds(shapes)
  {
    let res = null;
    let segment = null;
    const segments = [], points = [];

    if (shapes && shapes.length>0)
    {
      for (let i=0; i<shapes.length; i++)
      {
        const s = shapes[i];
        if (s.class_name == "Shape_MoveTo")
        {
          segment = this.New_Segment(segments, points, segment);
          this.Add_Pt(segment, points, s.pt);
        }
        else if (s.class_name == "Shape_LineTo")
        {
          this.Add_Pt(segment, points, s.pt);
        }
        else if (s.class_name == "Shape_ClosePath")
        {
          segment.mode = "android.opengl.GLES20.GL_LINE_LOOP";
        }
        else if (s.class_name == "Shape_BezierCurveTo")
        {
          const m = this.Get_Lats_Pt(points);
          const curve = new Bezier(m.x, m.y, s.cp1.x, s.cp1.y, 
            s.cp2.x, s.cp2.y, s.pt.x, s.pt.y);
          const pts = curve.getLUT(20);
          this.Add_Pts(segment, points, pts);
        }
        else if (s.class_name == "Shape_QuadraticCurveTo")
        {
          const m = this.Get_Lats_Pt(points);
          const curve = new Bezier(m.x, m.y, s.cp.x, s.cp.y, s.pt.x, s.pt.y);
          const pts = curve.getLUT(20);
          this.Add_Pts(segment, points, pts);
        }
        else if (s.class_name == "Shape_Rect")
        {
          segment = this.New_Segment(segments, points, segment);
          this.Add_Pt(segment, points, s.pt);
          this.Add_Pt(segment, points, {x: s.cp.x, y: s.pt.y});
          this.Add_Pt(segment, points, s.cp);
          this.Add_Pt(segment, points, {x: s.pt.x, y: s.cp.y});
          this.Add_Pt(segment, points, s.pt);
        }
        else if (s.class_name == "Shape_Ellipse")
        {
          const pts = this.Get_Ellipse(
            s.pt.x, s.pt.y, 
            s.Calc_Radius_X(), s.Calc_Radius_Y(), 
            s.Calc_Start_Angle(), s.Calc_End_Angle());
          this.Add_Pts(segment, points, pts);
        }
        else if (s.class_name == "Shape_Arc")
        {
          const pts = this.Get_Ellipse(
            s.pt.x, s.pt.y, 
            s.Calc_Radius(), s.Calc_Radius(), 
            s.Calc_Start_Angle(), s.Calc_End_Angle());
          this.Add_Pts(segment, points, pts);
        }
      }
      segments.push(segment);
      res = {segments, points};
    }

    return res;
  }

  Get_Ellipse(cx, cy, radius_x, radius_y, start_angle, end_angle)
  {
    const angle = 0;
    const res = [];
    const dx = 1;
    const a1 = this.Normalise_Angle(start_angle);
    let a2 = this.Normalise_Angle(end_angle);
    if (a1>a2)
    {
      a2 = a2 + 2*Math.PI;
    }
    const dy = a2 - a1;

    for (let xt = 0; xt < dx; xt += 0.05) 
    {
      const a = (dy/dx)*xt+a1;

      //const x = cx - (radius_x * Math.sin(a)) * Math.sin(angle) + (radius_y * Math.cos(a)) * Math.cos(angle);
      //const y = cy + (radius_y * Math.cos(a)) * Math.sin(angle) + (radius_x * Math.sin(a)) * Math.cos(angle);
      const x = cx + (radius_x * Math.cos(a));
      const y = cy + (radius_y * Math.sin(a));
      
      res.push({x, y});
    }

    return res;
  }

  Normalise_Angle(a)
  {
    let na = a;

    if (a<0)
    {
      na = 2*Math.PI + a;
    }

    return na;
  }

  Add_Pts(segment, points, pts)
  {
    for (const pt of pts)
    {
      this.Add_Pt(segment, points, pt);
    }
  }

  Add_Pt(segment, points, pt)
  {
    segment.pt_count++;
    points.push(pt.x);
    points.push(pt.y);
  }

  New_Segment(segments, points, prev_segment)
  {
    if (prev_segment)
    {
      segments.push(prev_segment);
    }
    const segment = 
      {mode: "android.opengl.GLES20.GL_LINE_STRIP", pt_start: points.length/2, pt_count: 0};

    return segment;
  }

  Get_Lats_Pt(points)
  {
    const res = {x: 0, y: 0};

    if (points != null && points.length >= 2)
    {
      const last_idx = points.length - 1;
      res.y = points[last_idx];
      res.x = points[last_idx - 1];
    }

    return res;
  }

  OnClick_Run()
  {
    const js = this.shadowRoot.getElementById("txt_area").value;
    const page = window.open("", "plantinator", "width=500,height=500");
    page.document.open();
    page.document.write(js);
    page.document.close();
  }

  OnClick_Close()
  {
    this.Hide();
  }

  static get styles()
  {
    return css`
      :host
      {
        display: none;
        margin-top: 20px;
      }
      h2
      {
        font-weight: 100;
        font-family: serif;
        font-style: italic;
        font-size: 20px;
        box-shadow: 
          rgb(0,0,0) 0px 1px 0px 0px, 
          rgb(255,255,255) 0px 4px 0px 0px, 
          rgb(0,0,0) 0px 7px 0px 0px;    
        display: inline;      
        margin-right: 20px;  
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
        vertical-align: middle;
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
      textarea
      {
        margin-top: 20px;
        background-color: inherit;
        border: 1px solid #000;
        padding: 5px;
        font-family: monospace;
        font-size: 11px;
        tab-size: 2;
        width: 800px;
        height: 50%;
      }
      #hdr
      {
        
      }
    `;
  }

  render()
  {
    return html`
      <div id="hdr">
        <h2>Generated Code</h2>
        <button @click="${this.OnClick_Run}"><img src="images/play-outline.svg"></button>
        <button @click="${this.OnClick_Close}"><img src="images/close.svg"></button>
      </div>
      <textarea id="txt_area"></textarea>
    `;
  }
}

customElements.define('android-code-gen', Android_Code_Gen);

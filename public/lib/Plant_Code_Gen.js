import {LitElement, html, css} from "./lit-element/lit-element.js";

class Plant_Code_Gen extends LitElement 
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
  
  Gen_Code(plants, pt1, pt2, ctrl1, ctrl2)
  {
    let code;

      code = 
        "<html>\n" +
        "\t<head>\n" +
        "\t\t<title>Plantinator - Sample Page</title>\n" +
        "\t\t<script type=\"module\">\n" +
        "\t\t\timport * as pl from \"./lib/pa.js\";\n" +
        "\t\t\timport { Bezier } from \"./lib/bezierjs/bezier.js\";\n\n" +

        "\t\t\tclass Plant extends pl.Base_Plant_Maturing2\n" +
        "\t\t\t{\n" +
        
        "\t\t\t\tconstructor()\n" +
        "\t\t\t\t{\n" +
        "\t\t\t\t\tsuper();\n" +
        "\t\t\t\t\tthis.curve = new Bezier(" + 
          pt1.x + "," + pt1.y + "," + 
          ctrl1.x + "," + ctrl1.y + "," + 
          ctrl2.x + "," + ctrl2.y + "," + 
          pt2.x + "," + pt2.y + ");\n" +
        "\t\t\t\t\tthis.curve_pts = this.curve.getLUT(100);\n" +
        "\t\t\t\t}\n\n" +
        
        this.Gen_Branches(plants) +
        
        "\t\t\t\tRender()\n" +
        "\t\t\t\t{\n" +
        "\t\t\t\t\tfor (let c = 1; c < this.maturity; c++)\n" +
        "\t\t\t\t\t{\n" +
        "\t\t\t\t\t\tthis.canvas_ctx.beginPath();\n" +
        "\t\t\t\t\t\tthis.canvas_ctx.lineWidth = (this.maturity - c) / 10;\n" +
        "\t\t\t\t\t\tthis.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);\n" +
        "\t\t\t\t\t\tthis.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);\n" +
        "\t\t\t\t\t\tthis.canvas_ctx.stroke();\n" +
        "\t\t\t\t\t}\n" +
        "\t\t\t\t}\n" +

        "\t\t\t}\n\n" +

        "\t\t\tconst plant = new Plant();\n" +
        "\t\t\tplant.max_depth = 3;\n" +
        "\t\t\tconst plants = [plant];\n\n" +

        "\t\t\tconst canvas = document.getElementById(\"canvas\");\n" +
        "\t\t\tconst ctx = canvas.getContext(\"2d\");\n" +
        "\t\t\tctx.translate(canvas.width/2, canvas.height);\n" +
        "\t\t\tctx.scale(1, -1);\n" +
        "\t\t\tpl.Animate(ctx, plants);\n" +
        "\t\t</script>\n" +
        "\t</head>\n" +
        "\t<body>\n" +
        "\t\t<canvas id=\"canvas\" width=\"1000\" height=\"1000\" style=\"width:100%;height:100%;\">\n" +
        "\t</body>\n" +
        "</html>\n";

      this.shadowRoot.getElementById("txt_area").value = code;
  }

  Gen_Branches(plants)
  {
    let res = "", class_name = "Plant";

    if (plants && plants.length>0)
    {
      res =
        "\t\t\t\tInit_Branches()\n" +
        "\t\t\t\t{\n";
      for (let i=0; i<plants.length; i++)
      {
        const p = plants[i];
        if (p.class_name != "This")
        {
          class_name = "pl." + p.class_name;
        }
        res += "\t\t\t\t\tthis.Add_Plant_Abs(" +
          p.sprout_time + "," + 
          p.angle + "," + 
          "new " + class_name + "()," + 
          p.x_scale + "," + 
          p.y_scale + "," + 
          p.x + "," + 
          p.y + ");\n";
      }
      res += "\t\t\t\t}\n\n";
    }

    return res;
  }

  Append_Str(a, b, s)
  {
    let res;

    if (a && b)
    {
      res = a + s + b;
    }
    else if (a && !b)
    {
      res = a;
    }
    else if (!a && b)
    {
      res = b;
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
        padding: 16px;
        font-family: monospace;
        font-size: 16px;
        tab-size: 2;
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
      <textarea id="txt_area" rows="20" cols="100"></textarea>
    `;
  }
}

customElements.define('plant-code-gen', Plant_Code_Gen);

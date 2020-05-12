import {LitElement, html, css} from "./lit-element/lit-element.js";

class Leaf_Code_Gen extends LitElement 
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

      code = 
        "<html>\n" +
        "\t<head>\n" +
        "\t\t<title>Plantinator - Sample Page</title>\n" +
        "\t\t<script type=\"module\">\n" +
        "\t\t\timport * as pl from \"./lib/pa.js\";\n" +

        "\t\t\tclass Leaf extends pl.Base_Plant_Maturing2\n" +
        "\t\t\t{\n" +
        "\t\t\t\tRender()\n" +
        "\t\t\t\t{\n" +
        "\t\t\t\t\tthis.canvas_ctx.scale(this.maturity/100, this.maturity/100);\n" +
        "\t\t\t\t\tthis.canvas_ctx.beginPath();\n" +
        this.Gen_Cmds(shapes) +
        "\t\t\t\t\tthis.canvas_ctx.stroke();\n" +
        "\t\t\t\t}\n" +
        "\t\t\t}\n\n" +

        "\t\t\tconst canvas = document.getElementById(\"canvas\");\n" +
        "\t\t\tconst ctx = canvas.getContext(\"2d\");\n" +
        "\t\t\tctx.translate(canvas.width/2, canvas.height/2);\n" +
        "\t\t\tctx.scale(1, -1);\n" +
        "\t\t\tctx.strokeStyle=\"#000\";\n" +
        "\t\t\tctx.lineWidth = 1;\n\n" +
    
        "\t\t\tconst plant = new Leaf();\n" +
        "\t\t\tplant.maturity_rate = 1;\n" +
        "\t\t\tplant.maturity = 100;\n" +
        "\t\t\tplant.level = 1;\n" +
        "\t\t\tplant.canvas_ctx = ctx;\n" +
        "\t\t\tplant.x = 0;\n" +
        "\t\t\tplant.y = 0;\n" +
        "\t\t\tplant.x_scale = 7;\n" +
        "\t\t\tplant.y_scale = 7;\n" +
        "\t\t\tplant.angle = 0;\n" +
        "\t\t\tplant.Render_All();\n" +

        "\t\t</script>\n" +
        "\t</head>\n" +
        "\t<body>\n" +
        "\t\t<canvas id=\"canvas\" width=\"1000\" height=\"1000\" style=\"width:100%;height:100%;\">\n" +
        "\t</body>\n" +
        "</html>\n";

      this.shadowRoot.getElementById("txt_area").value = code;
  }

  Gen_Cmds(shapes)
  {
    let res = "";

    if (shapes && shapes.length>0)
    {
      for (let i=0; i<shapes.length; i++)
      {
        const s = shapes[i];
        res += "\t\t\t\t\tthis.canvas_ctx." + s.To_Cmd_Str() + ";\n";
      }
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

customElements.define('leaf-code-gen', Leaf_Code_Gen);

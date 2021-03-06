import {LitElement, html, css} from "./lit-element/lit-element.js";

class Scene_Code_Gen extends LitElement 
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
  
  Gen_Scene(plants)
  {
    let code, plant, array_code;

    if (plants && plants.length>0)
    {
      code = 
        "<html>\n" +
        "\t<head>\n" +
        "\t\t<title>Plantinator - Sample Page</title>\n" +
        "\t\t<script type=\"module\">\n" +
        "\t\t\timport * as pl from \"./lib/pa.js\";\n";
      for (let i=0; i<plants.length; i++)
      {
        plant = plants[i];
        code += this.Gen_Plant(i, plant);

        array_code = this.Append_Str(array_code, "plant"+i, ", ");
      }
      code += 
        "\n\t\t\tconst plants=["+array_code+"];\n"+
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
  }

  Gen_Plant(i, plant)
  {
    const p = "plant"+i;
    const res = 
      "\n\t\t\tconst "+p+" = new pl."+plant.class_name+"();\n" +
      "\t\t\t"+p+".id = "+plant.id+";\n" +
      "\t\t\t"+p+".class_name = \""+plant.class_name+"\";\n" +
      "\t\t\t"+p+".name = \""+p+"\";\n" +
      "\t\t\t"+p+".maturity_rate = "+plant.maturity_rate+";\n" +
      "\t\t\t"+p+".maturity = 0;\n" +
      "\t\t\t"+p+".max_depth = "+plant.max_depth+";\n" +
      "\t\t\t"+p+".x = "+plant.x+";\n" +
      "\t\t\t"+p+".y = "+plant.y+";\n" +
      "\t\t\t"+p+".x_scale = "+plant.x_scale+";\n" +
      "\t\t\t"+p+".y_scale = "+plant.y_scale+";\n" +
      "\t\t\t"+p+".angle = "+plant.angle+";\n";

    return res;
  }

  Gen_Bud()
  {

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

customElements.define('scene-code-gen', Scene_Code_Gen);

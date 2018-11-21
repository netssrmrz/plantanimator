import { Bezier } from "./bezierjs/bezier.js";

export class Plant
{
  constructor()
  {
    this.maturity = 0;
  }

  Animate()
  {
    Plant_Animate.plant = this;
    Plant_Animate();
  }

  Next_Frame()
  {
    let res = false;

    this.canvas_ctx.clearRect(0, 0, this.canvas_ctx.canvas.width, this.canvas_ctx.canvas.height);
    this.Render_All();
    res = this.Grow_All();

    return res;
  }

  Grow_All()
  {
    var res = false, branch_res;

    if (this.maturity < 100)
    {
      this.maturity += this.maturity_rate;
      if (this.maturity > 100)
        this.maturity = 100;

      this.Grow();
      res = true;
    }

    if (this.branches)
      for (var c = 0; c < this.branches.length; c++)
      {
        branch_res = this.branches[c].Grow_All();
        res = res || branch_res;
      }

    return res;
  }

  Render_All()
  {
    var branch;

    this.canvas_ctx.save();
    this.canvas_ctx.translate(this.x, this.y);
    this.canvas_ctx.rotate(this.angle);
    this.canvas_ctx.scale(this.scale, this.scale);

    this.Render();
    if (this.branches)
      for (var c = 0; c < this.branches.length; c++)
      {
        branch = this.branches[c];
        branch.Render_All();
      }

    this.canvas_ctx.restore();
  }

  Add_Branch(plant)
  {
    if (!this.branches)
      this.branches = [];
    this.branches.push(plant);
  }

  Equal(a, b)
  {
    return Math.abs(a - b) <= Number.EPSILON;
  }

  Dump(level)
  {
    let res = "";

    res = JSON.stringify(this).padStart(res.length + level, "&nbsp;") + "<br>";

    //if (this.branches)
    //for (var c = 0; c < this.branches.length; c++)
    //res = res + this.branches[c].Dump(level + 1);

    return res;
  }

  Grow()
  {
  }

  Render()
  {
  }
}

function Plant_Animate()
{
  //document.getElementById("log").innerHTML = Plant_Animate.plant.Dump(0);
  if (Plant_Animate.plant.Next_Frame())
    window.requestAnimationFrame(Plant_Animate);
};

export class Plant2 extends Plant
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0, 0,100, 100,0, 100,100);
    this.curve_pts = this.curve.getLUT(100);
  }

  Render()
  {
    var c;

    this.canvas_ctx.moveTo(0, 0);
    for (c=0; c<this.maturity; c++)
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
    this.canvas_ctx.stroke();
  }

  Grow()
  {
    if (this.Equal(this.maturity, 25) && this.level > 0)
    {
      const size = this.maturity;
      const plant = new Plant2();
      plant.x = this.curve_pts[this.maturity].x;
      plant.y = this.curve_pts[this.maturity].y;
      plant.angle = 1;
      plant.maturity_rate = 1;
      plant.level = this.level - 1;
      plant.scale = 0.5;
      plant.canvas_ctx = this.canvas_ctx;
      this.Add_Branch(plant);
    }
    if (this.Equal(this.maturity, 75) && this.level > 0)
    {
      const size = this.maturity;
      const plant = new Plant2();
      plant.x = this.curve_pts[this.maturity].x;
      plant.y = this.curve_pts[this.maturity].y;
      plant.angle = 5;
      plant.maturity_rate = 1;
      plant.level = this.level - 1;
      plant.scale = 0.5;
      plant.canvas_ctx = this.canvas_ctx;
      this.Add_Branch(plant);
    }
  }
}

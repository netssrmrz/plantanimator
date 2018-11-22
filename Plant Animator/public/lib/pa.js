import { Bezier } from "./bezierjs/bezier.js";

class Plant
{
  constructor()
  {
    this.level = 0;
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

    res = this.Grow();

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
    plant.canvas_ctx = this.canvas_ctx;
    plant.level = this.level - 1;

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
    return false;
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

class Plant_Maturing extends Plant
{
  constructor()
  {
    super();
    this.maturity = 0;
  }

  Grow()
  {
    var res = false;

    if (this.maturity < 100)
    {
      this.maturity += this.maturity_rate;
      if (this.maturity > 100)
        this.maturity = 100;

      this.Grow_Maturing();

      res = true;
    }

    return res;
  }

  Grow_Maturing()
  {
  }
}

export class Plant_Stem extends Plant_Maturing
{
  constructor()
  {
    super();
    this.curve = new Bezier(0, 0, 0, 1000, 1000, 0, 1000, 1000);
    this.curve_pts = this.curve.getLUT(100);
  }

  Render()
  {
    var c;

    //this.canvas_ctx.moveTo(this.curve_pts[0].x, this.curve_pts[0].y);
    this.canvas_ctx.lineCap = 'round';
    for (c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = (this.maturity - c) / 10;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }

  Grow_Maturing()
  {
    if (this.Equal(this.maturity, 25) && this.level > 0)
      this.Add_Stem(6.5, 0.5);
    if (this.Equal(this.maturity, 75) && this.level > 0)
      this.Add_Stem(5, 0.25);
  }

  Add_Stem(angle, scale)
  {
    const plant = new Plant_Stem();
    plant.x = this.curve_pts[this.maturity].x;
    plant.y = this.curve_pts[this.maturity].y;
    plant.angle = angle;
    plant.maturity_rate = this.maturity_rate;
    plant.scale = scale;
    this.Add_Branch(plant);
  }
}

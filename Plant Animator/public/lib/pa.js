import { Bezier } from "./bezierjs/bezier.js";

class Plant
{
  constructor()
  {
    this.level = 0;
    this.canvas_ctx = null;
    this.branches = null;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
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
    var res = false, branch_res, c;

    res = this.Grow();

    if (this.branches)
      for (c = 0; c < this.branches.length; c++)
      {
        branch_res = this.branches[c].Grow_All();
        res = res || branch_res;
      }

    return res;
  }

  Render_All()
  {
    var branch, c;

    this.canvas_ctx.save();
    this.canvas_ctx.translate(this.x, this.y);
    this.canvas_ctx.rotate(this.angle);

    this.Render();
    if (this.branches)
      for (c = 0; c < this.branches.length; c++)
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
    this.maturity_rate = 1;
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

class Plant_Flower extends Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.fillStyle = "yellow";
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.quadraticCurveTo(this.maturity / 2, this.maturity / 2, 0, this.maturity);
    this.canvas_ctx.quadraticCurveTo(-this.maturity / 2, this.maturity / 2, 0, 0);
    this.canvas_ctx.fill();
  }
}

class Plant_Leaf extends Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.fillStyle = "green";
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.quadraticCurveTo(this.maturity/2, this.maturity / 2, 0, this.maturity);
    this.canvas_ctx.quadraticCurveTo(-this.maturity/2, this.maturity / 2, 0, 0);
    this.canvas_ctx.fill();
  }
}

export class Plant_Stem extends Plant_Maturing
{
  constructor(scale)
  {
    super();
    this.scale = scale;
    this.curve = new Bezier(0, 0, 0, 1000 * this.scale, 1000 * this.scale, 0, 1000 * this.scale, 1000 * this.scale);
    this.curve_pts = this.curve.getLUT(100);
  }

  Render()
  {
    var c;

    this.canvas_ctx.lineCap = 'round';
    this.canvas_ctx.strokeStyle = "brown";

    for (c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = ((this.maturity - c) / 10) * this.scale;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }

  Grow_Maturing()
  {
    if (this.level > 1)
    {
      if (this.Equal(this.maturity, 25))
        this.Add_Stem(6.5, this.scale / 2);
      if (this.Equal(this.maturity, 50))
        this.Add_Leaf(6.5);
      if (this.Equal(this.maturity, 75))
        this.Add_Stem(5, this.scale / 3);
    }
  }

  Add_Leaf(angle)
  {
    const plant = new Plant_Leaf();
    plant.x = this.curve_pts[this.maturity].x;
    plant.y = this.curve_pts[this.maturity].y;
    plant.angle = angle;
    plant.maturity_rate = this.maturity_rate;
    this.Add_Branch(plant);
  }

  Add_Stem(angle, scale)
  {
    const plant = new Plant_Stem(scale);
    plant.x = this.curve_pts[this.maturity].x;
    plant.y = this.curve_pts[this.maturity].y;
    plant.angle = angle;
    plant.maturity_rate = this.maturity_rate;
    this.Add_Branch(plant);
  }
}

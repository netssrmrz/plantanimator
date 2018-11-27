import { Bezier } from "./bezierjs/bezier.js";

export function Random(base, delta)
{
  return base + (Math.random() - 0.5) * delta;
}

class Plant
{
  constructor()
  {
    this.curr_level = 0;
    this.canvas_ctx = null;
    this.branches = null;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.x_scale = 1;
    this.y_scale = 1;
    this.parent = null;
  }

  Next_Frame()
  {
    let res = false;

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
    this.canvas_ctx.scale(this.x_scale, this.y_scale);

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
    plant.level = this.level;
    plant.curr_level = this.curr_level + 1;
    plant.parent = this;

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

  Total_X_Scale()
  {
    var curr_plant, res = 1;

    for (curr_plant = this; curr_plant != null; curr_plant = curr_plant.parent)
      res = res * curr_plant.x_scale;

    return res;
  }

  Total_Y_Scale()
  {
    var curr_plant, res = 1;

    for (curr_plant = this; curr_plant != null; curr_plant = curr_plant.parent)
      res = res * curr_plant.y_scale;

    return res;
  }

  Reset()
  {
    this.branches = null;
    this.curr_level = 0;
  }
}

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
    var c, p = 4;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    for (c = 0; c < p; c++)
    {
      this.canvas_ctx.moveTo(0, 0);
      this.canvas_ctx.bezierCurveTo(this.maturity / 4, this.maturity / 4, this.maturity / 4, -this.maturity / 4, 0, 0);
      this.canvas_ctx.rotate(2 * Math.PI / p);
    }
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

class Plant_Leaf extends Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.quadraticCurveTo(this.maturity/4, this.maturity/4, 0, this.maturity/2);
    this.canvas_ctx.quadraticCurveTo(-this.maturity/4, this.maturity/4, 0, 0);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Stem extends Plant_Maturing
{
  constructor()
  {
    var x1, y1, x2, y2, cx1, cy1, cx2, cy2;

    super();

    x1 = 0; y1 = 0;
    x2 = 1000; y2 = 0;

    cx1 = 200; cy1 = -250;
    cx2 = 800; cy2 = 250;

    this.curve = new Bezier(
      x1, y1, cx1, cy1,
      cx2, cy2, x2, y2);
    this.curve_pts = this.curve.getLUT(100);
  }

  Render()
  {
    var c;

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
    if (this.curr_level < this.level)
    {
      if (this.maturity >= 10 && !this.branches)
        this.Add_Stem(Random(0, 0.5), 0.5, -0.5);

      if (this.maturity >= 20 && this.branches.length == 1)
        this.Add_Leaf(Random(4.7, 1));

      if (this.maturity >= 50 && this.branches.length == 2)
        this.Add_Stem(Random(0, 0.5), 0.25, 0.25);

      if (this.maturity >= 90 && this.branches.length == 3)
        this.Add_Flower(Random(0, 2));
    }
  }

  Add_Flower(angle)
  {
    const plant = new Plant_Flower();
    this.Add_Plant(angle, plant, 1 / this.Total_X_Scale(), 1 / this.Total_Y_Scale());
  }

  Add_Leaf(angle)
  {
    const plant = new Plant_Leaf();
    this.Add_Plant(angle, plant, 1 / this.Total_X_Scale(), 1 / this.Total_Y_Scale());
  }

  Add_Stem(angle, x_scale, y_scale)
  {
    const plant = new Plant_Stem();
    this.Add_Plant(angle, plant, x_scale, y_scale);
  }

  Add_Plant(angle, plant, x_scale, y_scale)
  {
    plant.x = this.curve_pts[Math.trunc(this.maturity)].x;
    plant.y = this.curve_pts[Math.trunc(this.maturity)].y;
    plant.x_scale = x_scale;
    plant.y_scale = y_scale;
    plant.angle = angle;
    plant.maturity_rate = this.maturity_rate;
    this.Add_Branch(plant);
  }
}

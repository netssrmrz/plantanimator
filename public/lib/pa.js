import { Bezier } from "./bezierjs/bezier.js";

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

export class Plant_Maturing extends Plant
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

export class Plant_Flower extends Plant_Maturing
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

export class Plant_Flower2 extends Plant_Maturing
{
  Render()
  {
    const r = this.maturity / 3;
    const cx = 0, cy = r;
    const petals = 4;
    const pr = r / petals;
    const py = cy;
    let c, px;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.arc(cx, cy, r, 0, Math.PI, true);
    for (c = 0; c < petals; c++)
    {
      px = c * 2 * pr - (petals - 1) * pr;
      this.canvas_ctx.moveTo(px + pr, py);
      this.canvas_ctx.arc(px, py, pr, 0, 2 * Math.PI);
    }
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower3 extends Plant_Maturing
{
  Render()
  {
    const r = this.maturity / 5;
    const cx = 0, cy = r;
    const petals = 4;
    const px = cx, py = cy;
    const prx = r / petals, pry = 1.5 * r;
    const pda = 0.3;
    let c, pr;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    for (c = 0; c < petals; c++)
    {
      pr = c * pda - 0.5 * (petals - 1) * pda;
      this.canvas_ctx.moveTo(px + prx, py);
      this.canvas_ctx.ellipse(px, py, prx, pry, pr, 0, Math.PI, false);
    }
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Leaf extends Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.quadraticCurveTo(this.maturity / 4, this.maturity / 4, 0, this.maturity / 2);
    this.canvas_ctx.quadraticCurveTo(-this.maturity / 4, this.maturity / 4, 0, 0);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Leaf2 extends Plant_Maturing
{
  Render()
  {
    const size = this.maturity / 2;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(size, size, -size, size, 0, 0);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Leaf3 extends Plant_Maturing
{
  Render()
  {
    const size = this.maturity;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(0, size / 2, size / 2, size / 2, 0, size);
    this.canvas_ctx.bezierCurveTo(-size / 2, size / 2, 0, size / 2, 0, 0);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Leaf4 extends Plant_Maturing
{
  Render()
  {
    const size = this.maturity / 2;
    const x1 = 0, y1 = 0;
    const x2 = size / 6, y2 = size / 2;
    const x3 = x1, y3 = size;
    const x4 = -x2, y4 = y2;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(x1, y1);
    this.canvas_ctx.bezierCurveTo(x1, y1 + size / 4, x2, y2 - size / 4, x2, y2);
    this.canvas_ctx.bezierCurveTo(x2, y2 + size / 4, x3, y3 - size / 4, x3, y3);
    this.canvas_ctx.bezierCurveTo(x3, y3 - size / 4, x4, y4 + size / 4, x4, y4);
    this.canvas_ctx.bezierCurveTo(x4, y4 - size / 4, x1, y1 + size / 4, x1, y1);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Leaf5 extends Plant_Maturing
{
  Render()
  {
    //const size = this.maturity / 2;
    const size = this.maturity;
    const x1 = 0, y1 = 0;
    const x2 = x1, y2 = size;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(x1, y1);
    this.canvas_ctx.bezierCurveTo(
      x1 - size / 6, y1 + size / 4, 
      x2 + size / 2, y2 - size / 4, 
      x2, y2);
    this.canvas_ctx.bezierCurveTo(
      x2 + size / 6, y2 - size / 4, 
      x1 - size / 2, y1 + size / 4, 
      x1, y1);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant1 extends Plant_Maturing
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
    const plant = new Plant_Flower3();
    this.Add_Plant(angle, plant, 1 / this.Total_X_Scale(), 1 / this.Total_Y_Scale());
  }

  Add_Leaf(angle)
  {
    const plant = new Plant_Leaf5();
    this.Add_Plant(angle, plant, 1 / this.Total_X_Scale(), 1 / this.Total_Y_Scale());
  }

  Add_Stem(angle, x_scale, y_scale)
  {
    const plant = new Plant1();
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

export function Animate(canvas_ctx, plants)
{
  var c, next_frame = false, next_plant_frame;

  canvas_ctx.clearRect(0, 0, canvas_ctx.canvas.width, canvas_ctx.canvas.height);
  for (c = 0; c < plants.length; c++)
  {
    next_plant_frame = plants[c].Next_Frame();
    next_frame = next_frame || next_plant_frame;
  }
  if (next_frame)
    window.requestAnimationFrame(() => Animate(canvas_ctx, plants));
};

function Random(base, delta)
{
  return base + (Math.random() - 0.5) * delta;
}

class xPlant_Branch extends Plant_Maturing
{
  constructor()
  {
    var x1, y1, x2, y2, cx1, cy1, cx2, cy2;

    super();

    x1 = 0; y1 = 0;
    x2 = 0; y2 = 50;

    cx1 = 10; cy1 = y2/2;
    cx2 = -cx1; cy2 = y2-cy1;

    this.curve = new Bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
    this.curve_pts = this.curve.getLUT(100);
  }

  Render()
  {
    var c;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(this.curve_pts[0].x, this.curve_pts[0].y);
    for (c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
    }
    this.canvas_ctx.stroke();
  }

  Grow_Maturing()
  {
    if (this.maturity == 100)
    {
      const plant = new pl.Plant_Leaf3();
      const xs = 1 / this.Total_X_Scale(), ys = Math.abs(1 / this.Total_Y_Scale());

      this.Add_Plant(-0.5, plant, xs, ys);
    }
    /*if (this.curr_level < this.level)
    {
      if (this.maturity >= 10 && !this.branches)
        this.Add_Stem(Random(0, 0.5), 0.5, -0.5);

      if (this.maturity >= 20 && this.branches.length == 1)
        this.Add_Leaf(Random(4.7, 1));

      if (this.maturity >= 50 && this.branches.length == 2)
        this.Add_Stem(Random(0, 0.5), 0.25, 0.25);

      if (this.maturity >= 90 && this.branches.length == 3)
        this.Add_Flower(Random(0, 2));
    }*/
  }

  Add_Leaf(angle)
  {
    const plant = new pl.Plant_Leaf5();
    this.Add_Plant(angle, plant, 1 / this.Total_X_Scale(), 1 / this.Total_Y_Scale());
  }

  Add_Stem(angle, x_scale, y_scale)
  {
    const plant = new Plant_Stem();
    this.Add_Plant(angle, plant, x_scale, y_scale);
  }

  Add_Plant(angle, plant, x_scale, y_scale)
  {
    plant.x = Get_Point(this.curve_pts, this.maturity).x;
    plant.y = Get_Point(this.curve_pts, this.maturity).y;
    plant.x_scale = x_scale;
    plant.y_scale = y_scale;
    plant.angle = angle;
    plant.maturity_rate = this.maturity_rate;
    this.Add_Branch(plant);
  }
}

function xGet_Point(pts, p)
{
  var res = null; 
  
  if (p < 0)
    res = pts[0];
  else if (p >= 100)
    res = pts[pts.length - 1];
  else
    res = pts[Math.trunc(p)];

  return res;
}

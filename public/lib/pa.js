import { Bezier } from "./bezierjs/bezier.js";

// Base Classes ===================================================================================

export class Plant
{
  constructor()
  {
    this.curr_depth = 0;
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
    this.canvas_ctx.scale(this.Get_X_Scale(), this.Get_Y_Scale());

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
    plant.max_depth = this.max_depth;
    plant.curr_depth = this.curr_depth + 1;
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
    {
      res = res * curr_plant.Get_X_Scale();
    }

    return res;
  }

  Total_Y_Scale()
  {
    var curr_plant, res = 1;

    for (curr_plant = this; curr_plant != null; curr_plant = curr_plant.parent)
      res = res * curr_plant.Get_Y_Scale();

    return res;
  }

  Reset()
  {
    this.branches = null;
    this.curr_depth = 0;
    this.maturity = 0;
  }

  Get_X_Scale()
  {
    var x_scale = 1;
    if (this.x_scale)
      x_scale = this.x_scale;
    return x_scale;
  }

  Get_Y_Scale()
  {
    var y_scale = 1;
    if (this.y_scale)
      y_scale = this.y_scale;
    return y_scale;
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

export class Plant_Maturing2 extends Plant
{
  constructor()
  {
    super();
    this.maturity = 0;
    this.maturity_rate = 1;
  }

  Init_Branches()
  {
  }

  Grow_All()
  {
    var res = false, branch_res, c, branch;

    res = this.Grow();

    if (this.branches)
      for (c = 0; c < this.branches.length; c++)
      {
        branch = this.branches[c];
        if (!branch.render && this.maturity>=branch.sprout_time)
        {
          branch.render = true;
        }
        if (branch.render)
        {
          branch_res = this.branches[c].Grow_All();
          res = res || branch_res;
        }
      }

    return res;
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

  Render_All()
  {
    var branch, c;

    if (!this.init)
    {
      this.Init_Branches();
      this.init = true;
    }

    this.canvas_ctx.save();
    this.canvas_ctx.translate(this.x, this.y);
    this.canvas_ctx.rotate(this.angle);
    this.canvas_ctx.scale(this.Get_X_Scale(), this.Get_Y_Scale());

    this.Render();
    if (this.branches)
      for (c = 0; c < this.branches.length; c++)
      {
        branch = this.branches[c];
        if (branch.render)
        {
          branch.Render_All();
        }
      }

    this.canvas_ctx.restore();
  }

  Add_Plant_No_Scale(sprout_time, angle, plant)
  {
    this.Add_Plant(sprout_time, angle, plant, 1 / this.Total_X_Scale(), 1 / this.Total_Y_Scale())
  }

  Add_Plant(sprout_time, angle, plant, x_scale, y_scale)
  {
    if (this.curr_depth < this.max_depth)
    {
      plant.sprout_time = sprout_time;
      plant.render = false;
      plant.x = this.curve_pts[Math.trunc(plant.sprout_time)].x;
      plant.y = this.curve_pts[Math.trunc(plant.sprout_time)].y;
      plant.x_scale = x_scale;
      plant.y_scale = y_scale;
      plant.angle = angle;
      plant.maturity_rate = this.maturity_rate;
      this.Add_Branch(plant);
    }
  }
}

// Sample Flowers =================================================================================

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
      this.canvas_ctx.bezierCurveTo(this.maturity, this.maturity, 
        this.maturity, -this.maturity, 0, 0);
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
      this.canvas_ctx.arc(px, py, pr, 0, Math.PI);
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
    for (c = 0; c < petals; c++)
    {
      pr = c * pda - 0.5 * (petals - 1) * pda;
      this.canvas_ctx.ellipse(px, py, prx, pry, pr, 0.7, 2.42, false);
    }
    this.canvas_ctx.moveTo(cx + r, cy);
    this.canvas_ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower4 extends Plant_Maturing
{
  Render()
  {
    const r = this.maturity / 3;
    const cx = 0, cy = r;
    const petals = 3;
    const pr = r / petals;
    const py = cy;
    let c, px;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();

    const x = - (petals - 1) * pr - pr;
    const y = py;

    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo
      (x, 0, 
      0, y, 
      x, y);

      this.canvas_ctx.moveTo(0, 0);
      this.canvas_ctx.bezierCurveTo
        (-x, 0, 
        0, y, 
        -x, y);
  
    for (c = 0; c < petals; c++)
    {
      px = c * 2 * pr - (petals - 1) * pr;
      this.canvas_ctx.moveTo(px + pr, py);
      this.canvas_ctx.arc(px, py, pr, 0, Math.PI);
    }
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower5 extends Plant_Maturing
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

    const x = - (petals - 1) * pr - pr;
    const y = py;

    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo
      (0, y, 
      x, y/4, 
      x, y);

      this.canvas_ctx.moveTo(0, 0);
      this.canvas_ctx.bezierCurveTo
        (0, y, 
        -x, y/4, 
        -x, y);
  
    for (c = 0; c < petals; c++)
    {
      px = c * 2 * pr - (petals - 1) * pr;
      this.canvas_ctx.moveTo(px + pr, py);
      this.canvas_ctx.arc(px, py, pr, 0, Math.PI);
    }
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower6 extends Plant_Maturing
{
  Render()
  {
    const r = this.maturity / 3;
    const cx = 0, cy = r;
    const petals = 5;
    const pr = r / petals;
    const py = cy;
    let c, px;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();

    const x = - (petals - 1) * pr - pr;
    const y = py;

    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo
      (x, y/2, 
      x, y, 
      x, y);

    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo
      (-x, y/2, 
      -x, y, 
      -x, y);
  
    for (c = 0; c < petals; c++)
    {
      px = c * 2 * pr - (petals - 1) * pr;
      this.canvas_ctx.moveTo(px + pr, py);
      this.canvas_ctx.arc(px, py, pr, 0, Math.PI);
    }
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower7 extends Plant_Maturing
{
  constructor()
  {
    super();
    this.petal = new Plant_Leaf6();
  }

  Render()
  {
    var c, p = 15;

    this.petal.canvas_ctx = this.canvas_ctx;
    this.petal.maturity = this.maturity;
    for (c = 0; c < p; c++)
    {
      this.petal.Render();
      this.canvas_ctx.rotate(2 * Math.PI / p);
    }
    this.canvas_ctx.beginPath();
    this.canvas_ctx.arc(0, 0, this.maturity/5, 0, 2 * Math.PI);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower8 extends Plant_Maturing
{
  constructor()
  {
    super();
    this.petal = new Plant_Leaf5();
  }

  Render()
  {
    var c, p = 30;

    this.petal.canvas_ctx = this.canvas_ctx;
    this.petal.maturity = this.maturity;
    for (c = 0; c < p; c++)
    {
      this.petal.Render();
      this.canvas_ctx.rotate(2 * Math.PI / p);
    }
    this.canvas_ctx.beginPath();
    this.canvas_ctx.arc(0, 0, this.maturity/5, 0, 2 * Math.PI);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower9 extends Plant_Maturing
{
  constructor()
  {
    super();
    this.petal = new Plant_Leaf4();
  }

  Render()
  {
    var c, p = 10;

    this.petal.canvas_ctx = this.canvas_ctx;
    this.petal.maturity = this.maturity;
    for (c = 0; c < p; c++)
    {
      this.petal.Render();
      this.canvas_ctx.rotate(2 * Math.PI / p);
    }
    this.canvas_ctx.beginPath();
    this.canvas_ctx.arc(0, 0, this.maturity/5, 0, 2 * Math.PI);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower10 extends Plant_Maturing
{
  constructor()
  {
    super();
    this.petal = new Plant_Leaf2();
  }

  Render()
  {
    var c, p = 5;

    this.petal.canvas_ctx = this.canvas_ctx;
    this.petal.maturity = this.maturity;
    for (c = 0; c < p; c++)
    {
      this.petal.Render();
      this.canvas_ctx.rotate(2 * Math.PI / p);
    }
    this.canvas_ctx.beginPath();
    this.canvas_ctx.arc(0, 0, this.maturity/5, 0, 2 * Math.PI);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower11 extends Plant_Maturing
{
  constructor()
  {
    super();
    this.petal = new Plant_Leaf();
  }

  Render()
  {
    var c, p = 5;

    this.petal.canvas_ctx = this.canvas_ctx;
    this.petal.maturity = this.maturity;
    for (c = 0; c < p; c++)
    {
      this.petal.Render();
      this.canvas_ctx.rotate(2 * Math.PI / p);
    }
    this.canvas_ctx.beginPath();
    this.canvas_ctx.arc(0, 0, this.maturity/5, 0, 2 * Math.PI);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower12 extends Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.arc(0, 0, this.maturity/2, 0, 2 * Math.PI);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

// Sample Leaves ==================================================================================

export class Plant_Leaf extends Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.quadraticCurveTo
      (this.maturity / 2, this.maturity / 2, 0, this.maturity);
    this.canvas_ctx.quadraticCurveTo(-this.maturity / 2, this.maturity / 2, 0, 0);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Leaf2 extends Plant_Maturing
{
  Render()
  {
    const size = this.maturity;

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
    const size = this.maturity;
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

export class Plant_Leaf6 extends Plant_Maturing
{
  Render()
  {
    const size = this.maturity;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(size/3, size*1.25, -size/3, size*1.25, 0, 0);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Leaf7 extends Plant_Maturing
{
  Render()
  {
    const size = this.maturity;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(size / 3, size / 3, size / 3, size - size / 3, 0, size);
    this.canvas_ctx.bezierCurveTo(-size / 2, size / 2, 0, size / 2, 0, 0);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Leaf8 extends Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.quadraticCurveTo
      (this.maturity / 4, this.maturity / 4, 0, this.maturity);
    this.canvas_ctx.quadraticCurveTo(-this.maturity / 4, this.maturity / 4, 0, 0);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

export class Plant_Leaf9 extends Plant_Maturing
{
  Render()
  {
    const size = this.maturity;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(size / 3, size / 3, size / 3, size - size / 3, 0, size);
    this.canvas_ctx.bezierCurveTo(0, size / 2, -size / 2, size / 2, 0, 0);
    this.canvas_ctx.fill();
    this.canvas_ctx.stroke();
  }
}

// Sample Plants ==================================================================================

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
    if (this.curr_depth < this.max_depth)
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

export class Plant2 extends Plant_Maturing2
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

  Init_Branches()
  {
    this.Add_Plant(10, Random(0, 0.5), new Plant2(), 0.5, -0.5);
    this.Add_Plant_No_Scale(20, Random(4.7, 1), new Plant_Leaf5());
    this.Add_Plant(50, Random(0, 0.5), new Plant2(), 0.25, 0.25);
    this.Add_Plant_No_Scale(90, Random(0, 2), new Plant_Flower3());
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
}

// Utils ==========================================================================================

export function Animate(canvas_ctx, plants)
{
  var c, next_frame = false, next_plant_frame;

  if (Array.isArray(plants))
  {
    canvas_ctx.clearRect(0, 0, canvas_ctx.canvas.width, canvas_ctx.canvas.height);
    for (c = 0; c < plants.length; c++)
    {
      next_plant_frame = plants[c].Next_Frame();
      next_frame = next_frame || next_plant_frame;
    }
  }
  else
  {
    plants.canvas_ctx.clearRect(0, 0, plants.canvas_ctx.canvas.width, plants.canvas_ctx.canvas.height);
    next_frame = plants.Next_Frame();
  }

  if (next_frame)
    window.requestAnimationFrame(() => Animate(canvas_ctx, plants));
};

export function Render(plants)
{
  var c, plant;

  for (c = 0; c < plants.length; c++)
  {
    plant = plants[c];
    plant.canvas_ctx.clearRect(0, 0, plant.canvas_ctx.canvas.width, plant.canvas_ctx.canvas.height);
    plant.Render_All();
  }
};

function Random(base, delta)
{
  return base + (Math.random() - 0.5) * delta;
}

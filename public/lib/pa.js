import { Bezier } from "./bezierjs/bezier.js";

// Base Classes ===================================================================================

export class Base_Plant
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
    //this.parent = null;
    this.stem_plant = null;
    this.sprout_time = 0;
    this.cmd = null;
    this.pot_size = 100;
    this.selected = false;
    this.scale_btn_path = null;
    this.rotate_btn_path = null;
    this.move_btn_path = null;
    this.time_btn_path = null;
    this.max_depth = 3;
    this.init = false;

    this.Set_Paths();
  }

  Set_Paths()
  {
    this.scale_btn_path = this.New_Btn_Path(12, "scl_btn");
    this.rotate_btn_path = this.New_Btn_Path(12, "rot_btn");
    this.move_btn_path = this.New_Btn_Path(12, "trn_btn");
    this.time_btn_path = this.New_Btn_Path(12, "spr_btn");
  }

  New_Btn_Path(size, id)
  {
    let btn_path;

    btn_path = new Path2D();
    btn_path.colour = "deeppink";
    btn_path.colour_hover = "#0f0";
    btn_path.hover = false;
    btn_path.rect(-0.5*size, -0.5*size, size, size);
    btn_path.size = size;
    btn_path.id = id;

    return btn_path;
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

  Add_Branch(plant)
  {
    plant.canvas_ctx = this.canvas_ctx;
    plant.max_depth = this.max_depth;
    plant.curr_depth = this.curr_depth + 1;
    //plant.parent = this;

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

  /*Total_X_Scale()
  {
    var curr_plant, res = 1;

    for (curr_plant = this; curr_plant != null; curr_plant = curr_plant.parent)
    {
      res = res * curr_plant.Get_X_Scale();
    }

    return res;
  }*/

  /*Total_Y_Scale()
  {
    var curr_plant, res = 1;

    for (curr_plant = this; curr_plant != null; curr_plant = curr_plant.parent)
      res = res * curr_plant.Get_Y_Scale();

    return res;
  }*/

  Reset()
  {
    this.branches = null;
    this.curr_depth = 0;
    this.maturity = 0;
    this.init = false;
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

  To_Canvas_Pt(ctx, sx, sy)
  {
    return {x: sx-ctx.canvas.width/2-4, y: ctx.canvas.height-sy+4};
  }

  To_Degrees(r)
  {
    return r*(180/Math.PI);
  }

  // Events =======================================================================================

  On_Mouse_Move(event, ctx)
  {
    let res = false;

    if (this.cmd)
    {
      const c_pt = this.To_Canvas_Pt(ctx, event.offsetX, event.offsetY);
      if (this.cmd.id == "move_plant")
      {
        this.x = c_pt.x;
        this.y = c_pt.y;
      }
      if (this.cmd.id == "scale_plant")
      {
        const m = new DOMMatrix();
        m.translateSelf(this.x, this.y);
        m.rotateSelf(this.To_Degrees(this.angle));
        m.invertSelf();
        const p = new DOMPoint(c_pt.x, c_pt.y);
        const tp = p.matrixTransform(m);
        this.x_scale = tp.x / (this.pot_size/2);
        this.y_scale = tp.y / (this.pot_size/2);
      }
      if (this.cmd.id == "rotate_plant")
      {
        const x_sign = Math.sign(this.x_scale);
        const y_sign = Math.sign(this.y_scale);
        const m = new DOMMatrix();
        m.translateSelf(this.x, this.y);
        m.scaleSelf(x_sign, y_sign);
        m.invertSelf();
        const p = new DOMPoint(c_pt.x, c_pt.y);
        const tp = p.matrixTransform(m);
        this.angle = Math.atan2(tp.y, tp.x) - (Math.PI/2);
        this.angle = this.angle * (x_sign*y_sign);
      }
      if (this.cmd.id == "time_plant")
      {
        this.sprout_time = c_pt.y / 10;
      }
    }
    else if (this.selected)
    {
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.scale_btn_path, 50, 50, true, true);
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.rotate_btn_path, 0, 50, true, true);
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.move_btn_path, 0, 0, true, true);
      if (this.stem_plant && this.stem_plant.Get_Trunk_Pt)
      {
        const pt = this.stem_plant.Get_Trunk_Pt(this.sprout_time);
        res = res || this.On_Mouse_Move_Btn(ctx, event, this.time_btn_path, pt.x, pt.y, false, false);
      }
    }

    return res;
  }

  On_Mouse_Move_Btn(ctx, event, path, x, y, is_relative, unscale)
  {
    let res = false;

    ctx.save();
    if (is_relative)
    {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.scale(this.x_scale, this.y_scale);
    }

    ctx.translate(x, y);
    if (unscale)
    {
      ctx.scale(1/this.x_scale, 1/this.y_scale);
    }
    const is_in_path = ctx.isPointInPath(path, event.offsetX, event.offsetY);
    if (path.hover != is_in_path)
    {
      path.hover = is_in_path;
      res = true;
    }
    ctx.restore();

    return res;
  }

  On_Mouse_Down(event, ctx)
  {
    if (this.selected)
    {
      if (this.move_btn_path.hover)
      {
        this.cmd = {id: "move_plant"};
      }
      if (this.scale_btn_path.hover)
      {
        this.cmd = {id: "scale_plant"};
      }
      if (this.rotate_btn_path.hover)
      {
        this.cmd = {id: "rotate_plant"};
      }
      if (this.time_btn_path.hover)
      {
        this.cmd = {id: "time_plant"};
      }
    }

    return false;
  }

  On_Mouse_Up(event, ctx)
  {
    let res = false;

    if (this.cmd)
    {
      this.cmd = null;
      res = true;
    }

    return res;
  }

  // Gfx ==========================================================================================

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

  Render()
  {
  }

  Render_Design(ctx)
  {
    const colour = "#aaa";
    const colour_selected = "#000";
    const pot_size = 100;

    if (this.selected)
    {
      ctx.strokeStyle = colour_selected;
      ctx.lineWidth = 3;
    }
    else
    {
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1;
    }
    const r = pot_size/2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(-r, -r);
    ctx.lineTo(-r, r);
    ctx.lineTo(r, r);
    ctx.lineTo(r, -r);
    ctx.lineTo(-r, -r);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 3*r);
    ctx.stroke();

    if (this.selected)
    {
      this.Render_Btn(ctx, this.scale_btn_path, 50, 50, true);
      this.Render_Btn(ctx, this.rotate_btn_path, 0, 50, true);
      this.Render_Btn(ctx, this.move_btn_path, 0, 0, true);
    }
  }

  Render_Design_Abs(ctx)
  {
    if (this.selected && this.stem_plant && this.stem_plant.Get_Trunk_Pt)
    {
      const pt = this.stem_plant.Get_Trunk_Pt(this.sprout_time);

      ctx.setLineDash([5, 5]);
      ctx.strokeStyle="#aaa";
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      this.Render_Btn(ctx, this.time_btn_path, pt.x, pt.y, false);
    }
  }

  Render_Btn(ctx, path, x, y, unscale)
  {
    ctx.save();
    ctx.translate(x, y);
    if (unscale)
    {
      ctx.scale(1/this.x_scale, 1/this.y_scale);
    }

    if (path.hover)
    {
      ctx.fillStyle = path.colour_hover;
    }
    else
    {
      ctx.fillStyle = path.colour;
    }
    ctx.fill(path);

    ctx.restore();
  }
}

export class Base_Plant_Maturing extends Base_Plant
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

export class Base_Plant_Maturing2 extends Base_Plant
{
  constructor()
  {
    super();
    this.maturity = 0;
    this.maturity_rate = 1;
  }

  Init_Trunk()
  {
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
      this.Init_Trunk();
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
        if (!branch.render && this.maturity>=branch.sprout_time)
        {
          branch.render = true;
        }
        if (branch.render)
        {
          branch.Render_All();
        }
      }

    this.canvas_ctx.restore();
  }

  /*Add_Plant_No_Scale(sprout_time, angle, plant)
  {
    this.Add_Plant(sprout_time, angle, plant, 1 / this.Total_X_Scale(), 1 / this.Total_Y_Scale())
  }*/

  Add_Plant_Abs(sprout_time, angle, plant, x_scale, y_scale, x, y)
  {
    if (this.curr_depth < this.max_depth)
    {
      plant.sprout_time = sprout_time;
      plant.render = false;
      plant.x = x;
      plant.y = y;
      plant.x_scale = x_scale;
      plant.y_scale = y_scale;
      plant.angle = angle;
      plant.maturity_rate = this.maturity_rate;
      plant.maturity = this.maturity;
      this.Add_Branch(plant);
    }
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

export class Plant_Flower extends Base_Plant_Maturing
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
  }
}

export class Plant_Flower2 extends Base_Plant_Maturing
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
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower3 extends Base_Plant_Maturing
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
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower4 extends Base_Plant_Maturing
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
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower5 extends Base_Plant_Maturing
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
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower6 extends Base_Plant_Maturing
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
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower7 extends Base_Plant_Maturing
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
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower8 extends Base_Plant_Maturing
{
  constructor()
  {
    super();
    this.petal = new Plant_Leaf5();
  }

  Render()
  {
    var c, p = 20;

    this.petal.canvas_ctx = this.canvas_ctx;
    this.petal.maturity = this.maturity;
    for (c = 0; c < p; c++)
    {
      this.petal.Render();
      this.canvas_ctx.rotate(2 * Math.PI / p);
    }
    //this.canvas_ctx.beginPath();
    //this.canvas_ctx.arc(0, 0, this.maturity/5, 0, 2 * Math.PI);
    //this.canvas_ctx.stroke();
  }
}

export class Plant_Flower9 extends Base_Plant_Maturing
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
    //this.canvas_ctx.beginPath();
    //this.canvas_ctx.arc(0, 0, this.maturity/5, 0, 2 * Math.PI);
    //this.canvas_ctx.stroke();
  }
}

export class Plant_Flower10 extends Base_Plant_Maturing
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
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower11 extends Base_Plant_Maturing
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
    this.canvas_ctx.stroke();
  }
}

export class Plant_Flower12 extends Base_Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.beginPath();
    this.canvas_ctx.arc(0, 0, this.maturity/2, 0, Math.PI*2);
    this.canvas_ctx.fill();
  }
}

// Sample Leaves ==================================================================================

export class Plant_Leaf extends Base_Plant_Maturing
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
  }
}

export class Plant_Leaf2 extends Base_Plant_Maturing
{
  Render()
  {
    const size = this.maturity;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(size, size, -size, size, 0, 0);
    this.canvas_ctx.fill();
  }
}

export class Plant_Leaf3 extends Base_Plant_Maturing
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
  }
}

export class Plant_Leaf4 extends Base_Plant_Maturing
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
  }
}

export class Plant_Leaf5 extends Base_Plant_Maturing
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
  }
}

export class Plant_Leaf6 extends Base_Plant_Maturing
{
  Render()
  {
    const size = this.maturity;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(size/3, size*1.25, -size/3, size*1.25, 0, 0);
    this.canvas_ctx.fill();
  }
}

export class Plant_Leaf7 extends Base_Plant_Maturing
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
  }
}

export class Plant_Leaf8 extends Base_Plant_Maturing
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
  }
}

export class Plant_Leaf9 extends Base_Plant_Maturing
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
  }
}

export class Plant_Leaf10 extends Base_Plant_Maturing
{
  Render()
  {
    const size = this.maturity;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(
      size*0.4, size*0.3, 
      size*0.4, size*0.7, 
      0, size);
    this.canvas_ctx.bezierCurveTo(
      size*0.1, size*0.7, 
      size*0.1, size*0.3, 
      0, 0);
      this.canvas_ctx.fill();
      //this.canvas_ctx.stroke();
    }
}

export class Plant_Leaf11 extends Base_Plant_Maturing
{
  Render()
  {
    const size = this.maturity;

    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(
      size*0.4, size*0.6, 
      size*0.4, size*1.0, 
      0, size);
    this.canvas_ctx.bezierCurveTo(
      size*0.1, size*0.7, 
      size*0.1, size*0.3, 
      0, 0);
      this.canvas_ctx.fill();
      //this.canvas_ctx.stroke();
    }
}

export class Plant_Leaf12 extends Base_Plant_Maturing
{
  Render()
  {
    const size = this.maturity;

    this.canvas_ctx.scale(0.95, 0.95);
    this.canvas_ctx.lineWidth = 2;
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(
      size*0.4, size*0.8, 
      size*0.4, size*1.2, 
      0, size);
    this.canvas_ctx.bezierCurveTo(
      size*0.1, size*0.8, 
      size*0.1, size*0.4, 
      0, 0);
    this.canvas_ctx.fill();
  }
}

// Sample Stems ===================================================================================

export class Plant_Stem1 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,495,994,-500,955,-328,689);
    this.curve_pts = this.curve.getLUT(100);
  }

  Render()
  {
    for (let c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = (this.maturity - c) / 10;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }
}

export class Plant_Stem2 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-250,200,250,800,0,1000);
    this.curve_pts = this.curve.getLUT(100);
  }

  Render()
  {
    for (let c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = (this.maturity - c) / 10;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }
}

export class Plant_Stem3 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,7,-184,146,-20,415,-27,987);
    this.curve_pts = this.curve.getLUT(100);
  }

  Render()
  {
    for (let c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = (this.maturity - c) / 10;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }
}
export class Plant_Stem4 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-171,253,319,872,-79,759);
    this.curve_pts = this.curve.getLUT(100);
  }

  Render()
  {
    for (let c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = (this.maturity - c) / 10;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }
}

export class Plant_Stem5 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-171,253,66,809,-23,773);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    console.log("Plant_Stem5.Init_Branches()");
    this.Add_Plant_Abs(10,-0.15,new Plant_Stem1(),-0.1,0.2,-45,100);
    this.Add_Plant_Abs(7.1,0,new Plant_Flower12(),0.2,0.2,-19,765);
  }

  Render()
  {
    for (let c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = (this.maturity - c) / 10;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }
}

export class Plant_Stem6 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-250,200,250,800,0,1000);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(76.8,0.5,new Plant_Stem1(),0.2,0.2,69,768);
    this.Add_Plant_Abs(74.3,0.6881449651458826,new Plant_Leaf(),0.5,0.5,65,743);
    this.Add_Plant_Abs(48.3,-1.2090670852749643,new Plant_Leaf(),0.7,0.7,-6,483);
    this.Add_Plant_Abs(25,0.8148014516014532,new Plant_Leaf(),1,1,-67,241);
    this.Add_Plant_Abs(29.4,0.21608497229678658,new Plant_Leaf(),0.8,0.8,-61,278);
  }

  Render()
  {
    for (let c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = (this.maturity - c) / 10;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }
}

export class Plant_Stem7 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-250,200,260,996,-72,923);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(4.2,-0.11487660541689904,new Plant_Leaf6(),1.8000000000000007,1.8000000000000007,-21,22);
    this.Add_Plant_Abs(61,0.5079812250083899,new Plant_Stem1(),0.3499999999999994,0.3499999999999994,36,745);
    this.Add_Plant_Abs(4.9,-0.33563855032760914,new Plant_Leaf6(),1.03,1.03,-59,89);
    this.Add_Plant_Abs(50,-0.6788490587889789,new Plant_Leaf6(),0.7599999999999998,0.7599999999999998,-70,155);
    this.Add_Plant_Abs(50,0.31561566203876645,new Plant_Leaf6(),0.8118143138725752,0.8002611451548056,19,673);
    this.Add_Plant_Abs(50,0.5503859476767916,new Plant_Leaf6(),0.8899999999999999,0.8899999999999999,14,638);
    this.Add_Plant_Abs(50,-0.6435011087932844,new Plant_Leaf6(),1,1,-9,540);
    this.Add_Plant_Abs(50,0.24841049935104054,new Plant_Leaf6(),1.12,1.12,-57,343);
    this.Add_Plant_Abs(90,0,new Plant_Flower9(),0.6099999999999997,0.6099999999999997,-70,924);
    this.Add_Plant_Abs(95,0,new Plant_Flower12(),0.36999999999999944,0.36999999999999944,-176,916);
  }

  Render()
  {
    for (let c = 1; c < this.maturity; c++)
    {
      this.canvas_ctx.beginPath();
      this.canvas_ctx.lineWidth = (this.maturity - c) / 10;
      this.canvas_ctx.moveTo(this.curve_pts[c - 1].x, this.curve_pts[c - 1].y);
      this.canvas_ctx.lineTo(this.curve_pts[c].x, this.curve_pts[c].y);
      this.canvas_ctx.stroke();
    }
  }
}

export class Plant_Stem8 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-332,95,338,889,-72,852);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(0,0,new Plant_Stem7(),1,1,0,0);
    this.Add_Plant_Abs(28.6,-0.0955948279770296,new Plant_Stem6(),-0.6099999999999999,0.6099999999999999,-71,223);
    this.Add_Plant_Abs(0,0.3453981633974479,new Plant_Stem1(),-0.39999999999999947,0.39999999999999947,0,0);
  }

  Render()
  {
    for (let c = 1; c < this.maturity; c++)
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

export function Animate(canvas_ctx, plants, on_finish_fn, on_stop_fn, on_clr_fn)
{
  var c, next_frame = false, next_plant_frame;

  // clear canvas
  if (on_clr_fn)
  {
    on_clr_fn(canvas_ctx);
  }
  else
  {
    canvas_ctx.clearRect(0, 0, canvas_ctx.canvas.width, canvas_ctx.canvas.height);
  }

  // render plants
  if (Array.isArray(plants))
  {
    for (c = 0; c < plants.length; c++)
    {
      plants[c].canvas_ctx = canvas_ctx;
      next_plant_frame = plants[c].Next_Frame();
      next_frame = next_frame || next_plant_frame;
    }
  }
  else
  {
    plants.canvas_ctx = canvas_ctx;
    next_frame = plants.Next_Frame();
  }

  // wait for next frame or stop if none
  if (canvas_ctx.stop)
  {
    canvas_ctx.stop = false;
    if (on_stop_fn)
    {
      on_stop_fn();
    }
  }
  else if (next_frame)
  {
    window.requestAnimationFrame(() => Animate(canvas_ctx, plants, on_finish_fn, on_stop_fn, on_clr_fn));
  }
  else if (on_finish_fn)
  {
    on_finish_fn();
  }
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

export class Plant_Bezier
{
  constructor()
  {
    this.name = null;
    this.class_name = "Plant_Bezier";
    this.x = 0;
    this.y = 0;
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    this.ctrl1_x = 0;
    this.ctrl1_y = 0;
    this.ctrl2_x = 0;
    this.ctrl2_y = 0;
    this.angle = 0;
    this.x_scale = 1;
    this.y_scale = 1;
    this.pt1_btn = null;
    this.pt2_btn = null;
    this.ctrl1_btn = null;
    this.ctrl2_btn = null;
    this.cmd = null;
    this.trunk_pts = null;

    this.Set_Paths();
  }

  Set_Paths()
  {
    this.pt1_btn = this.New_Btn_Path(12, "pt1");
    this.pt2_btn = this.New_Btn_Path(12, "pt2");
    this.ctrl1_btn = this.New_Btn_Path(12, "ctrl1");
    this.ctrl2_btn = this.New_Btn_Path(12, "ctrl2");
  }

  New_Btn_Path(size, id)
  {
    let btn_path;

    btn_path = new Path2D();
    btn_path.colour = "deeppink";
    btn_path.colour_hover = "#0f0";
    btn_path.hover = false;
    btn_path.rect(-0.5*size, -0.5*size, size, size);
    btn_path.size = size;
    btn_path.id = id;

    return btn_path;
  }

  Set_Pts(x1, y1, x2, y2, ctrl1_x, ctrl1_y, ctrl2_x, ctrl2_y)
  {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.ctrl1_x = ctrl1_x;
    this.ctrl1_y = ctrl1_y;
    this.ctrl2_x = ctrl2_x;
    this.ctrl2_y = ctrl2_y;

    const curve = new Bezier
      (this.x1, this.y1, this.ctrl1_x, this.ctrl1_y, this.ctrl2_x, this.ctrl2_y, this.x2, this.y2);
    this.trunk_pts = curve.getLUT(100);
  }

  Get_Trunk_Pt(sprout_time)
  {
    let trunk_pt_idx = Math.trunc(sprout_time+0.5);
    if (trunk_pt_idx < 0)
    {
      trunk_pt_idx = 0;
    }
    else if (trunk_pt_idx >= this.trunk_pts.length)
    {
      trunk_pt_idx = this.trunk_pts.length -1;
    }

    return this.trunk_pts[trunk_pt_idx];
  }

  To_Canvas_Pt(ctx, sx, sy)
  {
    return {x: sx-ctx.canvas.width/2-4, y: ctx.canvas.height-sy+4};
  }

  // Events =======================================================================================

  On_Mouse_Up(event, ctx)
  {
    let res = false;

    if (this.cmd)
    {
      if (this.cmd.id == "pt1" || this.cmd.id == "pt2" || this.cmd.id == "ctrl1" || this.cmd.id == "ctrl2")
      {
        this.Set_Pts(this.x1, this.y1, this.x2, this.y2, this.ctrl1_x, this.ctrl1_y, this.ctrl2_x, this.ctrl2_y);
      }
      this.cmd = null;
      res = true;
    }

    return res;
  }

  On_Mouse_Move(event, ctx)
  {
    let res = false;

    if (this.cmd)
    {
      const c_pt = this.To_Canvas_Pt(ctx, event.offsetX, event.offsetY);
      if (this.cmd.id == "pt1")
      {
        this.x1 = c_pt.x;
        this.y1 = c_pt.y;
      }
      else if (this.cmd.id == "pt2")
      {
        this.x2 = c_pt.x;
        this.y2 = c_pt.y;
      }
      else if (this.cmd.id == "ctrl1")
      {
        this.ctrl1_x = c_pt.x;
        this.ctrl1_y = c_pt.y;
      }
      else if (this.cmd.id == "ctrl2")
      {
        this.ctrl2_x = c_pt.x;
        this.ctrl2_y = c_pt.y;
      }
      res = true;
    }
    else if (this.selected)
    {
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.pt1_btn, this.x1, this.y1);
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.pt2_btn, this.x2, this.y2);
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.ctrl1_btn, this.ctrl1_x, this.ctrl1_y);
      res = res || this.On_Mouse_Move_Btn(ctx, event, this.ctrl2_btn, this.ctrl2_x, this.ctrl2_y);
    }

    return res;
  }

  On_Mouse_Move_Btn(ctx, event, path, x, y)
  {
    let res = false;

    ctx.save();
    ctx.translate(x, y);
    const is_in_path = ctx.isPointInPath(path, event.offsetX, event.offsetY);
    if (path.hover != is_in_path)
    {
      path.hover = is_in_path;
      res = true;
    }
    ctx.restore();

    return res;
  }

  On_Mouse_Down(event, ctx)
  {
    if (this.selected)
    {
      if (this.pt1_btn.hover)
      {
        this.cmd = {id: "pt1"};
      }
      if (this.pt2_btn.hover)
      {
        this.cmd = {id: "pt2"};
      }
      if (this.ctrl1_btn.hover)
      {
        this.cmd = {id: "ctrl1"};
      }
      if (this.ctrl2_btn.hover)
      {
        this.cmd = {id: "ctrl2"};
      }
    }

    return false;
  }

  // Gfx ==========================================================================================

  Render()
  {

  }

  Render_Design(ctx)
  {
    if (this.selected)
    {
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
    }
    else
    {
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 1;
    }

    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.moveTo(this.trunk_pts[0].x, this.trunk_pts[0].y);
    for (let i=1; i<this.trunk_pts.length; i++)
    {
      ctx.lineTo(this.trunk_pts[i].x, this.trunk_pts[i].y);
    }
    ctx.stroke();

    if (this.selected)
    {
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.strokeStyle="#aaa";
      ctx.beginPath();
      ctx.moveTo(this.x1, this.y1);
      ctx.lineTo(this.ctrl1_x, this.ctrl1_y);
      ctx.moveTo(this.x2, this.y2);
      ctx.lineTo(this.ctrl2_x, this.ctrl2_y);
      ctx.stroke();

      this.Render_Btn(ctx, this.pt1_btn, this.x1, this.y1);
      this.Render_Btn(ctx, this.pt2_btn, this.x2, this.y2);
      this.Render_Btn(ctx, this.ctrl1_btn, this.ctrl1_x, this.ctrl1_y);
      this.Render_Btn(ctx, this.ctrl2_btn, this.ctrl2_x, this.ctrl2_y);
    }
  }

  Render_Btn(ctx, path, x, y)
  {
    ctx.save();
    ctx.translate(x, y);

    if (path.hover)
    {
      ctx.fillStyle = path.colour_hover;
    }
    else
    {
      ctx.fillStyle = path.colour;
    }
    ctx.fill(path);

    ctx.restore();
  }
}

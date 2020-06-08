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
    return {x: sx-ctx.canvas.width/2-4, y: -(sy-ctx.canvas.height/2-4)};
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
        this.x = c_pt.x*(1/ctx.x_scale);
        this.y = c_pt.y*(1/ctx.y_scale);
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
    if (this.fill_style)
    {
      this.canvas_ctx.fillStyle = this.fill_style;
    }
    if (this.stroke_style)
    {
      this.canvas_ctx.strokeStyle = this.stroke_style;
    }

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

export class Plant_Flower13 extends Base_Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.scale(this.maturity/100, this.maturity/100);
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(-92, 74);
    this.canvas_ctx.arc(6, 96, 100, -2.925042348613704, -0.1571102653469605);
    this.canvas_ctx.quadraticCurveTo(91, 125, 73, 78);
    this.canvas_ctx.quadraticCurveTo(58, 123, 39, 79);
    this.canvas_ctx.quadraticCurveTo(23, 127, 8, 79);
    this.canvas_ctx.quadraticCurveTo(-14, 122, -24, 82);
    this.canvas_ctx.quadraticCurveTo(-46, 121, -53, 82);
    this.canvas_ctx.quadraticCurveTo(-74, 122, -92, 74);
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

export class Plant_Leaf13 extends Base_Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.scale(this.maturity/100, this.maturity/100);
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(-5.5, 27.5, -5, 56.5, 11.3, 48.400000000000006);
    this.canvas_ctx.bezierCurveTo(21.1, 41, 0.6000000000000001, 25.6, 0, 0.1);
    this.canvas_ctx.fill();
  }
}

export class Plant_Leaf14 extends Base_Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.scale(this.maturity/100, this.maturity/100);
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.quadraticCurveTo(9, 12, 12.6, 28.5);
    this.canvas_ctx.bezierCurveTo(23.4, 46.8, 47.7, 55.8, 55.8, 90);
    this.canvas_ctx.bezierCurveTo(59.4, 100.8, 61.2, 121.2, 64.2, 144.6);
    this.canvas_ctx.bezierCurveTo(57.6, 126.3, 24.3, 106.8, 14.4, 86.4);
    this.canvas_ctx.bezierCurveTo(6, 69.6, 11.1, 51, 11.4, 36.9);
    this.canvas_ctx.quadraticCurveTo(14.1, 30.6, 0, 0);
    this.canvas_ctx.fill();
  }
}

export class Plant_Leaf15 extends Base_Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.scale(this.maturity/100, this.maturity/100);
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.bezierCurveTo(-2.7, 39.6, 71.1, 88.8, 34.2, 110.1);
    this.canvas_ctx.bezierCurveTo(0.3, 123.6, -0.6, 51, 0, 0);
    this.canvas_ctx.fill();
  }
}

export class Plant_Leaf16 extends Base_Plant_Maturing
{
  Render()
  {
    this.canvas_ctx.scale(this.maturity/100, this.maturity/100);
    this.canvas_ctx.beginPath();
    this.canvas_ctx.moveTo(0, 0);
    this.canvas_ctx.quadraticCurveTo(-38.4, 42, -20.7, 79.2);
    this.canvas_ctx.arc(-11.4, 105.6, 27.9, -1.9017490754220399, 0.6533047162725802);
    this.canvas_ctx.lineTo(21.6, 137.4);
    this.canvas_ctx.lineTo(13.5, 136.5);
    this.canvas_ctx.lineTo(12.9, 144);
    this.canvas_ctx.lineTo(8.4, 140.7);
    this.canvas_ctx.lineTo(4.5, 147);
    this.canvas_ctx.lineTo(0.9, 144);
    this.canvas_ctx.lineTo(-2.4, 148.8);
    this.canvas_ctx.lineTo(-6.9, 133.8);
    this.canvas_ctx.arc(-12.6, 105.9, 28.5, 1.3694792184202558, -2.025311769576292);
    this.canvas_ctx.quadraticCurveTo(-41.1, 35.7, 0, 0);
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

export class Plant_Stem9 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(-6,95,300,322,362,515,326,910);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(14,-2.384758148031105,new Plant_Leaf5(),1.5,1.5,100,181);
    this.Add_Plant_Abs(11,0.6593100683328581,new Plant_Leaf5(),1.5,1.5,90,169);
    this.Add_Plant_Abs(9,-2.547842986879022,new Plant_Leaf5(),1.5,1.5,59,145);
    this.Add_Plant_Abs(6,0.5266272714337505,new Plant_Leaf5(),1.5,1.5,40,129);
    this.Add_Plant_Abs(2,-2.6962916097021075,new Plant_Leaf5(),1.5,1.5,19,114);
    this.Add_Plant_Abs(0,0.4547192748209694,new Plant_Leaf5(),1.5,1.5,-2,99);
    this.Add_Plant_Abs(50,0.7944069286878652,new Plant_Leaf5(),1.5,1.5,130,210);
    this.Add_Plant_Abs(19,-2.3380146751193664,new Plant_Leaf5(),1.25,1.25,145,223);
    this.Add_Plant_Abs(21,0.7853981633974483,new Plant_Leaf5(),1.25,1.25,162,240);
    this.Add_Plant_Abs(50,-2.340322807200555,new Plant_Leaf5(),1.25,1.25,176,257);
    this.Add_Plant_Abs(50,0.8238407534186365,new Plant_Leaf5(),1.25,1.25,194,275);
    this.Add_Plant_Abs(50,-2.279422598922567,new Plant_Leaf5(),1.25,1.25,208,295);
    this.Add_Plant_Abs(50,0.8996524913588879,new Plant_Leaf5(),1.25,1.25,219,311);
    this.Add_Plant_Abs(50,-2.204429334864642,new Plant_Leaf5(),1.25,1.25,231,328);
    this.Add_Plant_Abs(36,0.94677327381814,new Plant_Leaf5(),1.25,1.25,241,343);
    this.Add_Plant_Abs(39,-2.1240906521171894,new Plant_Leaf5(),1,1,251,360);
    this.Add_Plant_Abs(40,0.9670469933974601,new Plant_Leaf5(),1,1,263,378);
    this.Add_Plant_Abs(44,-2.1112158270654806,new Plant_Leaf5(),1,1,272,402);
    this.Add_Plant_Abs(46,1.1071487177940904,new Plant_Leaf5(),1,1,283,422);
    this.Add_Plant_Abs(50,-1.97568811307998,new Plant_Leaf5(),1,1,290,446);
    this.Add_Plant_Abs(53,1.1943059923483736,new Plant_Leaf5(),1,1,300,467);
    this.Add_Plant_Abs(56,-1.9055331641117113,new Plant_Leaf5(),1,1,304,486);
    this.Add_Plant_Abs(73,1.5042281630190728,new Plant_Leaf5(),0.75,0.75,334,642);
    this.Add_Plant_Abs(71,-1.677531999444032,new Plant_Leaf5(),0.75,0.75,329,619);
    this.Add_Plant_Abs(68,1.4410937896389844,new Plant_Leaf5(),0.75,0.75,330,597);
    this.Add_Plant_Abs(50,-1.7475051828649333,new Plant_Leaf5(),0.75,0.75,324,574);
    this.Add_Plant_Abs(50,1.3397056595989998,new Plant_Leaf5(),0.75,0.75,321,550);
    this.Add_Plant_Abs(61,-1.8094056493030974,new Plant_Leaf5(),0.75,0.75,315,529);
    this.Add_Plant_Abs(58,1.2490457723982544,new Plant_Leaf5(),0.75,0.75,311,508);
    this.Add_Plant_Abs(76,-1.612438905893485,new Plant_Leaf5(),0.5,0.5,334,663);
    this.Add_Plant_Abs(77,1.5707963267948966,new Plant_Leaf5(),0.5,0.5,334,681);
    this.Add_Plant_Abs(79,-1.5916266468311135,new Plant_Leaf5(),0.5,0.5,336,698);
    this.Add_Plant_Abs(81,1.5707963267948966,new Plant_Leaf5(),0.5,0.5,335,722);
    this.Add_Plant_Abs(83,-1.551190995937692,new Plant_Leaf5(),0.5,0.5,336,742);
    this.Add_Plant_Abs(85,-4.673946390363502,new Plant_Leaf5(),0.5,0.5,336,762);
    this.Add_Plant_Abs(87,-1.501939837493852,new Plant_Leaf5(),0.5,0.5,335,782);
    this.Add_Plant_Abs(89,-4.651240817735388,new Plant_Leaf5(),0.25,0.25,334,799);
    this.Add_Plant_Abs(90,-1.5208379310729538,new Plant_Leaf5(),0.22,0.22,335,817);
    this.Add_Plant_Abs(91,-4.630936936078818,new Plant_Leaf5(),0.19,0.19,333,831);
    this.Add_Plant_Abs(94,-1.501939837493852,new Plant_Leaf5(),0.16,0.16,333,849);
    this.Add_Plant_Abs(95,-4.626883686706485,new Plant_Leaf5(),0.13,0.13,330,866);
    this.Add_Plant_Abs(97,-1.4840579881189115,new Plant_Leaf5(),0.1,0.1,330,882);
    this.Add_Plant_Abs(97,-4.632558994672452,new Plant_Leaf5(),0.07,0.07,326,896);
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

export class Plant_Stem10 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-250,200,171,504,165,918);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(4,-0.920925877382949,new Plant_Leaf11(),3,3,-39,36);
    this.Add_Plant_Abs(4,-0.5290767031646826,new Plant_Leaf9(),6,6,-78,183);
    this.Add_Plant_Abs(40,0.0660196174786769,new Plant_Leaf9(),5,5,-44,294);
    this.Add_Plant_Abs(65,-0.14481249823893916,new Plant_Leaf9(),-4,4,42,487);
    this.Add_Plant_Abs(50,0.4673105962810409,new Plant_Leaf7(),5,5,-44,41);
    this.Add_Plant_Abs(10,1.0321189850405048,new Plant_Leaf12(),3,3,-6,6);
    this.Add_Plant_Abs(14,-0.7016782278699055,new Plant_Leaf8(),7,4,-41,42);
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

export class Plant_Stem11 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-250,200,250,800,-496,998);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(27,-4.649970170388732,new Plant_Stem10(),0.25,0.25,-72,117);
    this.Add_Plant_Abs(20,-1.6095926132103333,new Plant_Stem10(),0.2,0.2,-78,189);
    this.Add_Plant_Abs(99.5,0,new Plant_Flower9(),1,1,-252,620);
    this.Add_Plant_Abs(42,0,new Plant_Flower9(),0.8,0.8,28,374);
    this.Add_Plant_Abs(6.6,-0.2629947316809196,new Plant_Stem2(),-0.5,0.5,-34,37);
    this.Add_Plant_Abs(50,0,new Plant_Stem1(),0.5,0.5,-78,263);
    this.Add_Plant_Abs(50,0.22471116841464278,new Plant_Stem4(),0.5,0.5,-60,522);
    this.Add_Plant_Abs(95.1,0.49513326346840447,new Plant_Flower9(),0.6264926431319213,0.5708826219999855,-92,846);
    this.Add_Plant_Abs(83,-4.599661368794312,new Plant_Stem10(),0.1,0.1,-246,888);
    this.Add_Plant_Abs(50,1.231503712340852,new Plant_Leaf10(),1.5,1.5,-79,180);
    this.Add_Plant_Abs(50,1.0999024678141933,new Plant_Leaf11(),1.5,1.5,-77,181);
    this.Add_Plant_Abs(50,0.44530104388768565,new Plant_Leaf12(),-1.3,1.3,-78,177);
    this.Add_Plant_Abs(50,0.9865250492139879,new Plant_Leaf10(),1,1,-77,287);
    this.Add_Plant_Abs(50,0.8032306410357486,new Plant_Leaf11(),1,1,-77,290);
    this.Add_Plant_Abs(50,0.16116626431310999,new Plant_Leaf12(),-1,1,-76,294);
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

export class Plant_Stem12 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-105,171,50,755,55,918);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(28,-0.4576596566168929,new Plant_Leaf14(),2,2,-34,242);
    this.Add_Plant_Abs(31,0.9352106199703458,new Plant_Leaf14(),2,2,-38,226);
    this.Add_Plant_Abs(52.9,0.8318762947484513,new Plant_Leaf14(),2,2,-7,514);
    this.Add_Plant_Abs(53.8,-0.5493744847715509,new Plant_Leaf14(),2,2,-5,528);
    this.Add_Plant_Abs(47.9,0.21043020334647378,new Plant_Leaf14(),2,2,22,691);
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

export class Plant_Stem13 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-178,243,-152,500,-4,770);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(51.7,-0.3562196553961501,new Plant_Flower13(),2.207920314235605,2.0379126296251617,-55,666);
    this.Add_Plant_Abs(3.3,-0.03682544972883206,new Plant_Leaf5(),1.6768060508329803,3.83096873752448,-28,42);
    this.Add_Plant_Abs(17,0.402747400722818,new Plant_Leaf10(),-2.822002153974412,3.7242856822434804,-87,160);
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

export class Plant_Stem14 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-173,228,-65,679,149,752);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(72.8,-0.6885591581361412,new Plant_Leaf15(),2.395151131395851,3.4473832188738722,26,656);
    this.Add_Plant_Abs(63,0,new Plant_Leaf15(),1.62,2.22,-20,585);
    this.Add_Plant_Abs(33,0.4549142065923797,new Plant_Leaf15(),1.5748142747638534,2.0681295897501197,-86,310);
    this.Add_Plant_Abs(11,1.09867434439112,new Plant_Leaf15(),1,1,-45,77);
    this.Add_Plant_Abs(21,-0.33394507184489397,new Plant_Leaf15(),1.4576244869586312,1.839383281162082,-81,218);
    this.Add_Plant_Abs(53.1,-0.690446457054692,new Plant_Leaf15(),2.2230514507786334,2.4590327869288386,-55,489);
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

export class Plant_Stem15 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-226,335,154,452,-102,768);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(70.7,-0.4547192748209694,new Plant_Leaf16(),2.760507402261943,2.866426151509404,-11,552);
    this.Add_Plant_Abs(82,1.0303768265243125,new Plant_Leaf16(),-0.651694623541531,0.5419355290503267,-28,639);
    this.Add_Plant_Abs(58,-1.1071487177940904,new Plant_Leaf16(),0.6260990336999407,0.6260990336999407,-18,464);
    this.Add_Plant_Abs(64,0.9481255380378295,new Plant_Leaf16(),-1.4117769913548215,1.1776611255709883,-13,512);
    this.Add_Plant_Abs(50,-1.2187520124794793,new Plant_Leaf16(),1.342872451880055,1.5095342255085347,-44,378);
    this.Add_Plant_Abs(53.3,0.9827937232473292,new Plant_Leaf16(),-1,1,-25,434);
    this.Add_Plant_Abs(38.7,-1.5707963267948966,new Plant_Leaf16(),0.58,0.6,-57,334);
    this.Add_Plant_Abs(33.6,0.7853981633974483,new Plant_Leaf16(),-1.1455129855222068,1.145512985522207,-65,299);
    this.Add_Plant_Abs(16.9,-1.0969449903001363,new Plant_Leaf16(),1.4729901384407773,1.4697959219076029,-69,171);
    this.Add_Plant_Abs(18.7,0.9487643115057245,new Plant_Leaf16(),-0.8010423493928454,0.7053588834623059,-74,189);
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

export class Plant_Stem16 extends Base_Plant_Maturing2
{
  constructor()
  {
    super();
    this.curve = new Bezier(0,0,-250,200,112,443,3,730);
    this.curve_pts = this.curve.getLUT(100);
  }

  Init_Branches()
  {
    this.Add_Plant_Abs(92,0.2629947316809196,new Plant_Leaf2(),1.4551086699553786,1.8658667580030168,15,693);
    this.Add_Plant_Abs(80,-1.120135000714263,new Plant_Leaf2(),1,1,23,598);
    this.Add_Plant_Abs(53,0.563316261491968,new Plant_Leaf2(),0.65209647851831,0.35492278414328327,-37,372);
    this.Add_Plant_Abs(1.3,-0.23783592745745064,new Plant_Leaf2(),0.3845498061450867,0.7006578670034159,-16,15);
    this.Add_Plant_Abs(23,0.7170118198069448,new Plant_Leaf2(),0.808662846649787,1.23193522575185,-91,166);
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

// Shapes ===============================================================================

export class Shape
{
  constructor()
  {
    this.Init_Shape();
    this.pt = this.New_Btn_Path("pt", 0, 0);
  }

  Init_Shape()
  {
    this.class_name = "Shape";
    this.name = "shape";
    this.selected = false;
    this.cmd = null;
    this.btns = [];
    this.prev_shape = null;
    this.pt = null;
  }

  New_Btn_Path(id, x, y)
  {
    const r = 5;
    const p = new Path2D();
    p.moveTo(-r, -r);
    p.lineTo(-r, r);
    p.lineTo(r, r);
    p.lineTo(r, -r);
    p.closePath();
    p.hover = false;
    p.id = id;
    p.x = x;
    p.y = y;
    this.btns.push(p);

    return p;
  }

  To_Canvas_Pt(ctx, sx, sy)
  {
    return {x: sx-ctx.canvas.width/2-4, y: -(sy-ctx.canvas.height/2-4)};
  }

  Pt_Translate(pt, ptd)
  {
    pt.x += ptd.x;
    pt.y += ptd.y;
  }

  Pt_Scale(pt, pts)
  {
    pt.x = pt.x * pts.x;
    pt.y = pt.y * pts.y;
  }

  Pt_Difference(pta, ptb)
  {
    const x = pta.x-ptb.x;
    const y = pta.y-ptb.y;
    return {x, y};
  }

  Params_Str()
  {
    let res = "";

    if (this.pt)
    {
      res = "x = "+Round(this.pt.x)+", y = "+Round(this.pt.y);
    }

    return res;
  }

  To_Cmd_Str()
  {
    let params = "";
    const s = ", ";
    const x = this.pt.x;
    const y = this.pt.y;

    params = Append_Str(params, x, s);
    params = Append_Str(params, y, s);

    return "moveTo("+params+")";
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

  On_Mouse_Move(event, ctx)
  {
    let res = false;

    if (this.cmd)
    {
      const c_pt = this.To_Canvas_Pt(ctx, event.offsetX, event.offsetY);
      this.On_Mouse_Move_Cmd(ctx, c_pt, this.cmd);
    }
    else if (this.selected)
    {
      for (let i=0; i<this.btns.length; i++)
      {
        res = res || this.On_Mouse_Move_Btn(ctx, event, this.btns[i]);
      }
    }

    return res;
  }

  On_Mouse_Move_Cmd(ctx, c_pt, cmd)
  {
    cmd.x = c_pt.x*(1/ctx.x_scale);
    cmd.y = c_pt.y*(1/ctx.y_scale);
  }

  On_Mouse_Move_Btn(ctx, event, path)
  {
    let res = false;

    ctx.save();
    ctx.translate(path.x, path.y);
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
      for (let i=0; i<this.btns.length; i++)
      {
        if (this.btns[i].hover)
        {
          this.cmd = this.btns[i];
          break;
        }
      }
    }

    return false;
  }

  Render(ctx)
  {
    if (this.selected)
    {
      for (let i=0; i<this.btns.length; i++)
      {
        this.Render_Btn(ctx, this.btns[i]);
      }
    }
  }

  Render_Btn(ctx, path)
  {
    const r = 5;

    ctx.save();
    ctx.translate(path.x, path.y);

    if (path.hover)
    {
      ctx.fillStyle = "#0f0";
    }
    else
    {
      ctx.fillStyle = "deeppink";
    }
    ctx.fill(path);

    ctx.restore();
  }
}

export class Shape_Arc extends Shape
{
  constructor()
  {
    super();
    this.cp = this.New_Btn_Path("cp", 100, 100);
    this.sa = this.New_Btn_Path("sa", 100, 0);
    this.ea = this.New_Btn_Path("ea", -120, 0);
  }

  Params_Str()
  {
    const s = ", ";
    let res = "";

    res = Append_Str(res, "x = "+Round(this.pt.x), s);
    res = Append_Str(res, "y = "+Round(this.pt.y), s);
    res = Append_Str(res, "radius = "+Round(this.Calc_Radius()), s);
    res = Append_Str(res, "<br>startAngle = "+Round(this.Calc_Start_Angle()), s);
    res = Append_Str(res, "endAngle = "+Round(this.Calc_End_Angle()), s);

    return res;
  }

  Calc_Radius()
  {
    let r = 0;
    const ptc = this.Pt_Difference(this.cp, this.pt);
    //const r = Math.hypot(ptc.x, ptc.y);
    if (Math.abs(ptc.x)<Math.abs(ptc.y))
    {
      r = Math.abs(ptc.x);
    }
    else
    {
      r = Math.abs(ptc.y);
    }

    return r;
  }

  Calc_Start_Angle()
  {
    const pta = this.Pt_Difference(this.sa, this.pt);
    return Math.atan2(pta.y, pta.x);
  }

  Calc_End_Angle()
  {
    const ptb = this.Pt_Difference(this.ea, this.pt);
    return Math.atan2(ptb.y, ptb.x);
  }

  To_Cmd_Str()
  {
    const s = ", ";
    const x = this.pt.x;
    const y = this.pt.y;
    const radius = this.Calc_Radius();
    const startAngle = this.Calc_Start_Angle();
    const endAngle = this.Calc_End_Angle();
    let params;

    params = Append_Str(params, x, s);
    params = Append_Str(params, y, s);
    params = Append_Str(params, radius, s);
    params = Append_Str(params, startAngle, s);
    params = Append_Str(params, endAngle, s);

    return "arc("+params+")";
  }

  On_Mouse_Move_Cmd(ctx, c_pt, cmd)
  {
    if (cmd.id == "pt")
    {
      const pts = {x: 1/ctx.x_scale, y: 1/ctx.y_scale};
      const c_pt_s = {x: c_pt.x, y: c_pt.y};
      this.Pt_Scale(c_pt_s, pts);
      const ptd = this.Pt_Difference(c_pt_s, cmd);

      this.Pt_Translate(this.cp, ptd);
      this.Pt_Translate(this.sa, ptd);
      this.Pt_Translate(this.ea, ptd);
    }
    super.On_Mouse_Move_Cmd(ctx, c_pt, cmd);
  }

  Render(ctx)
  {
    let r;

    super.Render(ctx);
    ctx.arc(this.pt.x, this.pt.y, this.Calc_Radius(), 
      this.Calc_Start_Angle(), this.Calc_End_Angle()); // [, anticlockwise]);
  }

  Render_Design(ctx)
  {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#aaa";
    ctx.setLineDash([5, 5]);

    const cp2 = {x: 2*this.pt.x-this.cp.x, y: 2*this.pt.y-this.cp.y};
    ctx.moveTo(this.cp.x, this.cp.y);
    ctx.lineTo(this.cp.x, cp2.y);
    ctx.lineTo(cp2.x, cp2.y);
    ctx.lineTo(cp2.x, this.cp.y);
    ctx.lineTo(this.cp.x, this.cp.y);

    ctx.moveTo(this.pt.x, this.pt.y);
    ctx.lineTo(this.sa.x, this.sa.y);

    ctx.moveTo(this.pt.x, this.pt.y);
    ctx.lineTo(this.ea.x, this.ea.y);

    ctx.stroke();
    ctx.restore();
  }
}

export class Shape_Ellipse extends Shape
{
  constructor()
  {
    super();
    this.cp = this.New_Btn_Path("cp", 100, 100);
    this.sa = this.New_Btn_Path("sa", 100, 0);
    this.ea = this.New_Btn_Path("ea", -120, 0);
  }

  Params_Str()
  {
    const s = ", ";
    let res = "";

    res = Append_Str(res, "x = "+Round(this.pt.x), s);
    res = Append_Str(res, "y = "+Round(this.pt.y), s);
    res = Append_Str(res, "radiusx = "+Round(this.Calc_Radius_X()), s);
    res = Append_Str(res, "radiusy = "+Round(this.Calc_Radius_Y()), s);
    res = Append_Str(res, "<br>startAngle = "+Round(this.Calc_Start_Angle()), s);
    res = Append_Str(res, "endAngle = "+Round(this.Calc_End_Angle()), s);

    return res;
  }

  To_Cmd_Str()
  {
    const s = ", ";
    const x = this.pt.x;
    const y = this.pt.y;
    const radius_x = this.Calc_Radius_X();
    const radius_y = this.Calc_Radius_Y();
    const rotation = 0;
    const startAngle = this.Calc_Start_Angle();
    const endAngle = this.Calc_End_Angle();
    let params;

    params = Append_Str(params, x, s);
    params = Append_Str(params, y, s);
    params = Append_Str(params, radius_x, s);
    params = Append_Str(params, radius_y, s);
    params = Append_Str(params, rotation, s);
    params = Append_Str(params, startAngle, s);
    params = Append_Str(params, endAngle, s);

    return "ellipse("+params+")";
  }

  Calc_Radius_X()
  {
    return Math.abs(this.cp.x-this.pt.x);
  }

  Calc_Radius_Y()
  {
    return Math.abs(this.cp.y-this.pt.y);
  }

  Calc_Start_Angle()
  {
    const pta = this.Pt_Difference(this.sa, this.pt);
    return Math.atan2(pta.y, pta.x);
  }

  Calc_End_Angle()
  {
    const ptb = this.Pt_Difference(this.ea, this.pt);
    return Math.atan2(ptb.y, ptb.x);
  }

  On_Mouse_Move_Cmd(ctx, c_pt, cmd)
  {
    if (cmd.id == "pt")
    {
      const pts = {x: 1/ctx.x_scale, y: 1/ctx.y_scale};
      const c_pt_s = {x: c_pt.x, y: c_pt.y};
      this.Pt_Scale(c_pt_s, pts);
      const ptd = this.Pt_Difference(c_pt_s, cmd);
      
      this.Pt_Translate(this.cp, ptd);
      this.Pt_Translate(this.sa, ptd);
      this.Pt_Translate(this.ea, ptd);
    }
    super.On_Mouse_Move_Cmd(ctx, c_pt, cmd);
  }

  Render(ctx)
  {
    super.Render(ctx);
    ctx.ellipse(this.pt.x, this.pt.y, 
      this.Calc_Radius_X(), this.Calc_Radius_Y(), 
      0, this.Calc_Start_Angle(), this.Calc_End_Angle()); // [, anticlockwise]);
  }

  Render_Design(ctx)
  {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#aaa";
    ctx.setLineDash([5, 5]);

    const cp2 = {x: 2*this.pt.x-this.cp.x, y: 2*this.pt.y-this.cp.y};
    ctx.moveTo(this.cp.x, this.cp.y);
    ctx.lineTo(this.cp.x, cp2.y);
    ctx.lineTo(cp2.x, cp2.y);
    ctx.lineTo(cp2.x, this.cp.y);
    ctx.lineTo(this.cp.x, this.cp.y);

    ctx.moveTo(this.pt.x, this.pt.y);
    ctx.lineTo(this.sa.x, this.sa.y);

    ctx.moveTo(this.pt.x, this.pt.y);
    ctx.lineTo(this.ea.x, this.ea.y);

    ctx.stroke();
    ctx.restore();
  }
}

export class Shape_Rect extends Shape
{
  constructor()
  {
    super();
    this.cp = this.New_Btn_Path("cp", 100, 100);
  }

  Params_Str()
  {
    const s = ", ";
    let res = "";

    res = Append_Str(res, "x = "+Round(this.pt.x), s);
    res = Append_Str(res, "y = "+Round(this.pt.y), s);
    res = Append_Str(res, "width = "+Round(this.Calc_Width()), s);
    res = Append_Str(res, "height = "+Round(this.Calc_Height()), s);

    return res;
  }

  To_Cmd_Str()
  {
    const s = ", ";
    let params;

    params = Append_Str(params, this.pt.x, s);
    params = Append_Str(params, this.pt.y, s);
    params = Append_Str(params, this.Calc_Width(), s);
    params = Append_Str(params, this.Calc_Height(), s);

    return "rect("+params+")";
  }

  Calc_Width()
  {
    return this.cp.x-this.pt.x;
  }

  Calc_Height()
  {
    return this.cp.y-this.pt.y;
  }

  Render(ctx)
  {
    super.Render(ctx);
    ctx.rect(this.pt.x, this.pt.y, this.Calc_Width(), this.Calc_Height());
  }
}

export class Shape_ClosePath extends Shape
{
  constructor()
  {
    super();
    this.Init_Shape();
  }

  Params_Str()
  {
    return "";
  }

  To_Cmd_Str()
  {
    return "closePath()";
  }

  Render(ctx)
  {
    ctx.closePath();
  }
}

export class Shape_ArcTo extends Shape
{
  constructor()
  {
    super();
    this.cp = this.New_Btn_Path("cp", 100, 100);
    this.rp = this.New_Btn_Path("rp", 100, 0);
  }

  Params_Str()
  {
    const s = ", ";
    let res = "";

    res = Append_Str(res, "x1 = "+Round(this.pt.x), s);
    res = Append_Str(res, "y1 = "+Round(this.pt.y), s);
    res = Append_Str(res, "x2 = "+Round(this.cp.x), s);
    res = Append_Str(res, "y2 = "+Round(this.cp.y), s);
    res = Append_Str(res, "r = "+Round(this.Calc_Radius()), s);

    return res;
  }

  To_Cmd_Str()
  {
    const s = ", ";
    let params;

    params = Append_Str(params, this.pt.x, s);
    params = Append_Str(params, this.pt.y, s);
    params = Append_Str(params, this.cp.x, s);
    params = Append_Str(params, this.cp.y, s);
    params = Append_Str(params, this.Calc_Radius(), s);

    return "arc("+params+")";
  }

  Calc_Radius()
  {
    return Math.hypot(this.rp.x, this.rp.y);
  }

  Render(ctx)
  {
    super.Render(ctx);
    ctx.arcTo(this.pt.x, this.pt.y, this.cp.x, this.cp.y, this.Calc_Radius());
  }

  Render_Design(ctx)
  {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#aaa";
    ctx.setLineDash([5, 5]);

    ctx.moveTo(this.prev_shape.pt.x, this.prev_shape.pt.y);
    ctx.lineTo(this.cp.x, this.cp.y);
    ctx.lineTo(this.pt.x, this.pt.y);

    ctx.moveTo(0, 0);
    ctx.lineTo(this.rp.x, this.rp.y);

    ctx.stroke();
    ctx.restore();
  }
}

export class Shape_QuadraticCurveTo extends Shape
{
  constructor()
  {
    super();
    this.cp = this.New_Btn_Path("cp", 100, 100);
  }

  Params_Str()
  {
    const s = ", ";
    let res = "";

    res = Append_Str(res, "cpx = "+Round(this.cp.x), s);
    res = Append_Str(res, "cpy = "+Round(this.cp.y), s);
    res = Append_Str(res, "x = "+Round(this.pt.x), s);
    res = Append_Str(res, "y = "+Round(this.pt.y), s);

    return res;
  }

  To_Cmd_Str()
  {
    const s = ", ";
    let params;

    params = Append_Str(params, this.cp.x, s);
    params = Append_Str(params, this.cp.y, s);
    params = Append_Str(params, this.pt.x, s);
    params = Append_Str(params, this.pt.y, s);

    return "quadraticCurveTo("+params+")";
  }

  Render(ctx)
  {
    super.Render(ctx);
    ctx.quadraticCurveTo(this.cp.x, this.cp.y, this.pt.x, this.pt.y);
  }

  Render_Design(ctx)
  {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#aaa";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(this.prev_shape.pt.x, this.prev_shape.pt.y);
    ctx.lineTo(this.cp.x, this.cp.y);
    ctx.lineTo(this.pt.x, this.pt.y);
    ctx.stroke();
    ctx.restore();
  }
}

export class Shape_BezierCurveTo extends Shape
{
  constructor()
  {
    super();
    this.cp1 = this.New_Btn_Path("cp1", -100, -100);
    this.cp2 = this.New_Btn_Path("cp2", 100, 100);
  }

  Params_Str()
  {
    const s = ", ";
    let res = "";

    res = Append_Str(res, "cp1x = "+Round(this.cp1.x), s);
    res = Append_Str(res, "cp1y = "+Round(this.cp1.y), s);
    res = Append_Str(res, "cp2x = "+Round(this.cp2.x), s);
    res = Append_Str(res, "cp2y = "+Round(this.cp2.y), s);
    res = Append_Str(res, "<br>x = "+Round(this.pt.x), s);
    res = Append_Str(res, "y = "+Round(this.pt.x), s);

    return res;
  }

  To_Cmd_Str()
  {
    const s = ", ";
    let params;

    params = Append_Str(params, this.cp1.x, s);
    params = Append_Str(params, this.cp1.y, s);
    params = Append_Str(params, this.cp2.x, s);
    params = Append_Str(params, this.cp2.y, s);
    params = Append_Str(params, this.pt.x, s);
    params = Append_Str(params, this.pt.y, s);

    return "bezierCurveTo("+params+")";
  }

  Render(ctx)
  {
    super.Render(ctx);
    ctx.bezierCurveTo(this.cp1.x, this.cp1.y, this.cp2.x, this.cp2.y, this.pt.x, this.pt.y);
  }

  Render_Design(ctx)
  {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#aaa";
    ctx.setLineDash([5, 5]);
    ctx.moveTo(this.prev_shape.pt.x, this.prev_shape.pt.y);
    ctx.lineTo(this.cp1.x, this.cp1.y);
    ctx.moveTo(this.cp2.x, this.cp2.y);
    ctx.lineTo(this.pt.x, this.pt.y);
    ctx.stroke();
    ctx.restore();
  }
}

export class Shape_LineTo extends Shape
{

  To_Cmd_Str()
  {
    const s = ", ";
    let params;

    params = Append_Str(params, this.pt.x, s);
    params = Append_Str(params, this.pt.y, s);

    return "lineTo("+params+")";
  }
  Render(ctx)
  {
    super.Render(ctx);
    ctx.lineTo(this.pt.x, this.pt.y);
  }
}

export class Shape_MoveTo extends Shape
{
  Render(ctx)
  {
    super.Render(ctx);
    ctx.moveTo(this.pt.x, this.pt.y);
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

export function Append_Str(a, b, sep)
{
  let res = "";

  if (!Empty(a) && !Empty(b))
  {
    res = a+sep+b;
  }
  else if (Empty(a) && !Empty(b))
  {
    res = b;
  }
  else if (!Empty(a) && Empty(b))
  {
    res = a;
  }

  return res;
}

function Empty(v)
{
  const res = v == null || v == undefined || v === "";
  return res;
}

function Round(num)
{
  return Math.round((num + Number.EPSILON) * 10000) / 10000;
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

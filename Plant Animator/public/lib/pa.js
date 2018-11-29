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

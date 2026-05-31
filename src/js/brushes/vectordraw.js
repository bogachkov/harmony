function vectordraw( context )
{
	this.init( context );
}

vectordraw.prototype =
{
	context: null,

	startX: null, startY: null,
	snapshot: null,

	init: function( context )
	{
		this.context = context;
		this.context.globalCompositeOperation = 'source-over';
	},

	destroy: function()
	{
		this.snapshot = null;
	},

	strokeStart: function( mouseX, mouseY )
	{
		this.startX = mouseX;
		this.startY = mouseY;

		// Snapshot the canvas so the rubber-band preview can be drawn
		// and erased without disturbing the existing artwork.
		this.snapshot = this.context.getImageData(0, 0, this.context.canvas.width, this.context.canvas.height);
	},

	drawLine: function( mouseX, mouseY )
	{
		this.context.lineWidth = BRUSH_SIZE;
		this.context.strokeStyle = "rgba(" + COLOR[0] + ", " + COLOR[1] + ", " + COLOR[2] + ", " + BRUSH_PRESSURE + ")";

		this.context.beginPath();
		this.context.moveTo(this.startX, this.startY);
		this.context.lineTo(mouseX, mouseY);
		this.context.stroke();
	},

	stroke: function( mouseX, mouseY )
	{
		// Restore the pre-stroke canvas, then redraw the line preview.
		if (this.snapshot)
			this.context.putImageData(this.snapshot, 0, 0);

		this.drawLine(mouseX, mouseY);
	},

	strokeEnd: function()
	{
		// The last preview is already committed on the canvas; just
		// release the snapshot.
		this.snapshot = null;
	}
}

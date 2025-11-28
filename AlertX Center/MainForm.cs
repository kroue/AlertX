using System;
using System.Drawing;
using System.Windows.Forms;

namespace AlertX_Center
{
    public class MainForm : Form
    {
        public MainForm()
        {
            Text = "AlertX Center";
            Width = 600;
            Height = 400;

            var label = new Label()
            {
                Text = "Hello from Windows Forms!",
                AutoSize = true,
                Location = new Point(20, 20),
                Font = new Font("Segoe UI", 12)
            };

            Controls.Add(label);
        }
    }
}

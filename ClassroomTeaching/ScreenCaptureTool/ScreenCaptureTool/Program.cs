using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.IO;
using System.Reflection;
using System.Drawing;
using System.Drawing.Imaging;
using System.Windows.Forms;
using System.Runtime.InteropServices;

using CommandLine;
using CommandLine.Text;

namespace ScreenCaptureTool
{
    class Options
    {
        /// <summary>
        /// capture bound
        /// </summary>
        [Option('b', "bound", HelpText = "specify the bound of screen for caputering, the format is [left,top,width,height]")]
        public String Bound { get; set; }

        /// <summary>
        /// capture the primary screen
        /// </summary>
        [Option('p', "primary", DefaultValue = false, HelpText = "capture the primary screen")]
        public bool CapturePrimary { get; set; }

        /// <summary>
        /// output path
        /// </summary>
        [Option('o', "output", DefaultValue = null, HelpText = "the output file name")]
        public String Output { get; set; }

        /// <summary>
        /// image format
        /// </summary>
        [Option('f', "format", DefaultValue = "png", HelpText = "format of the output image")]
        public String Format { get; set; }

        [HelpOption]
        public string GetUsage()
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            Version version = assembly.GetName().Version;

            var help = new HelpText()
            {
                Heading = new HeadingInfo("ScreenCaptureTool", $"{version.Major}.{version.Minor}"),
                AdditionalNewLineAfterOption = true,
                AddDashesToOption = true
            };

            help.AddOptions(this);

            return help;
        }
    }


    class Program
    {
        static readonly String[] SUPPORTED_FORMATS = new String[] { ".png", ".jpg" };

        [DllImport("gdi32.dll")]
        static extern int GetDeviceCaps(IntPtr hdc, int nIndex);

        static Size GetDeviceSize()
        {
            using (Graphics desktopWindowGraphic = Graphics.FromHwnd(IntPtr.Zero))
            {
                IntPtr hdc = desktopWindowGraphic.GetHdc();
                
                int width = GetDeviceCaps(hdc, (int)DeviceCap.DESKTOPHORZRES);
                int height = GetDeviceCaps(hdc, (int)DeviceCap.DESKTOPVERTRES);

                desktopWindowGraphic.ReleaseHdc();

                return new Size(width, height);
            }
        }

        static Bitmap Capture(int x, int y, int width, int height)
        {
            var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb);
            var captureGraphics = Graphics.FromImage(bitmap);

            captureGraphics.CopyFromScreen(x, y, 0, 0, new Size(width, height));

            return bitmap;
        }

        static string GetOutputPath(string path)
        {
            string directory;
            string filename;
            if (String.IsNullOrEmpty(path))
            {
                directory = Environment.CurrentDirectory;
                filename = null;
            }
            else
            {
                if (path.EndsWith("/") || path.EndsWith("\\"))
                {
                    directory = path;
                    filename = null;
                }
                else
                {
                    filename = Path.GetFileName(path);
                    directory = path.Substring(0, path.Length - filename.Length);
                }

                if (String.IsNullOrEmpty(directory))
                {
                    directory = Environment.CurrentDirectory;
                }
            }

            if (!Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            if (filename == null)
            {
                int maxIndex = 0;
                var namePattern = new Regex("^capture_(\\d+)\\.\\w+$");
                foreach (string filepath in Directory.GetFiles(directory))
                {
                    string name = Path.GetFileName(filepath);
                    Match match = namePattern.Match(name);
                    if (match.Success)
                    {
                        int index = Convert.ToInt32(match.Groups[1].Value);
                        maxIndex = Math.Max(maxIndex, index);
                    }
                }

                filename = $"capture_{maxIndex + 1}";
            }

            return Path.Combine(directory, filename);
        }

        static string[] ParseBounds(string boundNotation)
        {
            if (boundNotation[0] == '[' && boundNotation[boundNotation.Length - 1] == ']')
            {
                return boundNotation.Substring(1, boundNotation.Length - 2)
                    .Split(new char[] { ',' })
                    .Select(s => s.Trim())
                    .ToArray();
            }
            else
            {
                return null;
            }
        }

        static void Main(string[] args)
        {
            var options = new Options();
            bool parseSuccess = Parser.Default.ParseArguments(args, options);

            if (parseSuccess)
            {
                // decide capture bounds from options
                int[] bounds = null;

                if (!String.IsNullOrEmpty(options.Bound))
                {
                    string[] optBounds = ParseBounds(options.Bound);

                    if (optBounds != null && optBounds.Length == 4)
                    {
                        try
                        {
                            bounds = optBounds.Select(v => Convert.ToInt32(v)).ToArray();
                        }
                        catch (Exception)
                        {
                            Console.Error.WriteLine("invalid bounds");
                            Environment.Exit(1);
                        }
                    }
                    else
                    {
                        Console.Error.WriteLine("invalid bounds");
                        Environment.Exit(1);
                    }
                }
                else if (options.CapturePrimary)
                {
                    Screen primaryScreen = Screen.AllScreens.FirstOrDefault(s => s.Primary);
                    if (primaryScreen != null)
                    {
                        Size screenSize = GetDeviceSize();
                        bounds = new int[]
                        {
                            primaryScreen.Bounds.Left,
                            primaryScreen.Bounds.Top,
                            screenSize.Width,
                            screenSize.Height
                        };
                    }
                    else
                    {
                        Console.Error.WriteLine("cannot find primary screen");
                        Environment.Exit(2);
                    }
                }
                else
                {
                    Console.Error.WriteLine("missing capture options");
                    Environment.Exit(1);
                }

                // do capture
                Bitmap bitmap = Capture(bounds[0], bounds[1], bounds[2], bounds[3]);

                // decide output path
                string outputPath = GetOutputPath(options.Output);

                // decide extnsion
                string ext;

                if (!String.IsNullOrEmpty(options.Format))
                {
                    ext = options.Format;
                    if (ext[0] != '.')
                    {
                        ext = '.' + ext;
                    }

                    if (!SUPPORTED_FORMATS.Contains(ext))
                    {
                        Console.Error.WriteLine($"unsupported extension: {options.Format}");
                        Environment.Exit(1);
                    }
                }
                else
                {
                    ext = Path.GetExtension(outputPath);
                    if (String.IsNullOrEmpty(ext))
                    {
                        ext = ".png";
                    }
                }

                // decide format
                ImageFormat format;
                switch (ext)
                {
                    case ".png":
                        format = ImageFormat.Png;
                        break;
                    case ".jpg":
                    case ".jpeg":
                        format = ImageFormat.Jpeg;
                        break;
                    default:
                        ext = ".png";
                        format = ImageFormat.Png;
                        break;
                }

                if (!outputPath.EndsWith(ext))
                {
                    outputPath += ext;
                }

                // save captured image
                bitmap.Save(outputPath, format);

                Console.Out.WriteLine(outputPath);
            }
            else
            {
                Environment.Exit(1);
            }
        }
    }
}


from math import sin, cos, sqrt, pi
from datetime import datetime, timedelta
from PIL import Image
from pathlib import Path

def create_calendar(parameters):
    """Create a spiralife calendar from parameters"""
    print(parameters)
    hoch = parameters["image_height"] if "image_height" in parameters else 1500
    breit = parameters["image_width"] if "image_width" in parameters else 2000
    einheit = parameters["image_unit"] if "image_unit" in parameters else "px"
    start_year = parameters["start_year"] if "start_year" in parameters else 2000
    start_month = parameters["start_month"] if "start_month" in parameters else 1
    start_day = parameters["start_day"] if "start_day" in parameters else 1
    dt = datetime(start_year, start_month, start_day)
    input_image = parameters["input_image"] if "input_image" in parameters else None
    special_day_year = parameters["special_day_year"] if "special_day_year" in parameters else 2000
    special_day_month = parameters["special_day_month"] if "special_day_month" in parameters else 1
    special_day_day = parameters["special_day_day"] if "special_day_day" in parameters else 1
    special_day = datetime(special_day_year, special_day_month, special_day_day)
    output_file = parameters["output_file"] if "output_file" in parameters else "calendar.svg"
    total_days = parameters["total_days"] if "total_days" in parameters else 36526 # ~ 365.25 * 100
    rotation_constant = parameters["rotation_constant"] if "rotation_constant" in parameters else 630

    #def spiral(xm, ym, w, )

    def mitte(x1, y1, x2, y2, p):
        """
        Calculate a point on the line between two points (x1, y1) and (x2, y2).
        The point is calculated by the parameter p, which is a value between 0 and 1 and
        represents the distance from the calculated point to the first point (x1, y1) in 
        relation to the distance between the two points.
        """
        return (x1 + (x2 - x1) * p, y1 + (y2 - y1) * p)
    def quadratproj(x, y, b, h):
        """
        Project a point (x, y) onto the edges of a rectangle with width b and height h.
        The rectangle is centered at the origin (0, 0).
        The function returns the projected point (xq, yq).
        """
        if x == 0 and y == 0:
            return (0, 0)
        b = b / 2
        h = h / 2
        #print("x: %s y: %s b: %s h: %s"%(x,y,b,h))
        sc = b / abs(x) if abs(x) / b > abs(y) / h else h / abs(y)
        xq = x * sc
        yq = y * sc
        return (xq, yq)
    def quadmach(x, y, b, h):
        """
        Projects a point within a circle of radius 1 onto a rectangle with width b and height h.
        The closer the point is to the edge of the circle, the more it is adapted to the rectangular shape.
        The function returns the projected point (xq, yq) within the rectangle.
        """
        (xp, yp) = quadratproj(x, y, b, h)
        b = b / 2
        h = h / 2
        r = min(h, b)
        d = sqrt(x*x + y*y)
        x *= r
        y *= r
        return mitte(x, y, xp * d, yp * d, d)
    def hx(i):
        return "%x%x"%(i>>4, i%16)
    def kompl(x):
        return ((x[0] + 128)%256,(x[1] + 128)%256,(x[2] + 128)%256)
    def fastr(x):
        return hx(x[0]) + hx(x[1]) + hx(x[2])
    bil = Image.open(input_image) if input_image else None
    if bil:
        bilb = bil.width - 1
        bilh = bil.height - 1
        def bildfarbe(p):
            x = (p[0] / breit + 0.5)
            y = (p[1] / hoch + 0.5)
            x = x if x < 1 else 1
            x = x if x > 0 else 0
            y = y if y < 1 else 1
            y = y if y > 0 else 0
            return bil.getpixel((x*bilb, y*bilh))
    def adf(x, y):
        r = x + y
        return  0 if r < 0 else( 255 if r > 255 else r)
    def fplus(f1, f2):
        return [adf(f1[i], f2[i]) for i in range(3)]
        
        

    t = """<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg
    viewBox="{x} {y} {breit} {hoch}"
    height="{hoch}{einheit}"
    width="{breit}{einheit}"
    xmlns="http://www.w3.org/2000/svg"
        version="1.1" baseProfile="full"
    >
    """.format(x = -breit/2, y = -hoch/2, hoch = hoch, breit = breit, einheit = einheit)

    t += """\
    """
    xm = breit / 2
    ym = hoch / 2
    xa = 0
    ya = 0
    xap = 0
    yap = 0
    w = 0
    #total_days = 36526 # ~ 365.25 * 100
    z = 0
    pf = 0
    zs = 1 / total_days
    # rotation_constant = 630 
    br = 2*pi / rotation_constant * 0.85
    f = [[255, 255, 255],[255, 255, 255],[255, 255, 255],[255, 255, 255],[255, 255, 255],[130, 255, 100],[255, 100, 15]]
    mn = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"]
    mf = [[2, 100, 255],[44, 120, 210],[33, 180, 100],[100, 240, 120],[230, 222, 90],[255, 140, 0],[255, 0, 0],[190, 180, 0],[200, 180, 100],[190, 210, 100],[150, 150, 150],[70, 90, 120]]
    
    td = timedelta(1)
    gebs = []
    newy = []
    tex = []
    takt = []
    for i in range(total_days + 800):
        xn = sin(w) * pf
        yn = cos(w) * pf
        xnp = sin(w) * (pf + br)
        ynp = cos(w) * (pf + br)
        
        (xn, yn) = quadmach(xn, yn, breit * 0.99, hoch * 0.99)
        (xnp, ynp) = quadmach(xnp, ynp, breit * 0.99, hoch * 0.99)
        xm = (xn + xnp + xa + xap) / 4
        ym = (yn + ynp + ya + yap) / 4
        wd = dt.weekday()
        mo = dt.month - 1
        ff = [(f[wd][i] + mf[mo][i]) // 2 for i in range(3)]
        #bf = bildfarbe((xm, ym))
        #ff = fplus(ff, bf)
        if dt.day == 1:
            takt.append((xa, ya, xap, yap, (200,0,0), 2))
        elif dt.day % 10 == 1:
            takt.append((xa, ya, xap, yap, (0,0,200), 1.5))
        elif dt.day % 5 == 1:
            takt.append((xa, ya, xap, yap, (0,200,0), 1.4))
        if dt.day % 10 == 0:
            if dt.day >9:
                tex.append((xm, ym, dt.day, -(w / (2*pi))% 1 * 360 + 90, 4, [0,0,200]))
        elif dt.day % 5 == 0:
            if dt.day >9:
                tex.append((xm, ym, dt.day, -(w / (2*pi))% 1 * 360 + 90, 4, [0,100,0]))
        if dt.day < 4:
            tex.append((xm, ym, mn[dt.month - 1][dt.day - 1], -(w / (2*pi))% 1 * 360, 6, [0,0,0]))
        if dt.day in range(5, 9):
            tex.append((xm, ym, str(dt.year)[dt.day - 5], -(w / (2*pi))% 1 * 360, 7, [0,0,0]))
        if dt.day is special_day.day and dt.month is special_day.month:
            ff = [255,255,0]
            gebs.append((xm, ym, dt.year - special_day_year, -(w / (2*pi))% 1 * 360, [0,0,0]))
        t += '<path style="fill:#%s%s%s;stroke:#000000;stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"'%(hx(ff[0]), hx(ff[1]), hx(ff[2]))
        t += ' d = "M %s,%s L %s,%s %s,%s %s,%s Z '%(xn,yn, xnp,ynp, xap,yap, xa,ya)
        t += '"/>'
        xa = xn
        ya = yn
        xap = xnp
        yap = ynp
        z += zs
        pf = sqrt(z)
        w = pf * rotation_constant
        dt += td
        
    for y in takt:
        t += '''<line style="stroke:#%s;stroke-width:%s;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" x1="%s" y1="%s" x2="%s" y2="%s" />'''%(fastr(y[4]), y[5], y[0],y[1],y[2],y[3])
    for y in tex:
        t += """<text fill="#%s" text-anchor="middle" dominant-baseline="central" font-size="%s" transform=" translate(%s, %s) rotate(%s)">%s</text>"""%(fastr(y[5]), y[4], y[0],y[1], y[3],y[2])
    for y in gebs:
        t += """<text fill="#%s" text-anchor="middle" dominant-baseline="central" font-size="4px" transform=" translate(%s, %s) rotate(%s)">%s</text>"""%(fastr(y[4]), y[0],y[1], y[3],y[2])
    t += """
    </svg>
    """

    with open(output_file, "w") as f:
        f.write(t)
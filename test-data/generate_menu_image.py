from PIL import Image, ImageDraw, ImageFont


def font(path: str, size: int):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


w, h = 1200, 1600
img = Image.new("RGB", (w, h), color=(248, 246, 240))
d = ImageDraw.Draw(img)

title_font = font("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 64)
heading_font = font("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 42)
body_font = font("/System/Library/Fonts/Supplemental/Arial.ttf", 34)

y = 80
d.text((80, y), "FOODY TEST KITCHEN", fill=(30, 30, 30), font=title_font)
y += 95
d.text((80, y), "DINNER MENU", fill=(70, 70, 70), font=heading_font)
y += 90

d.line((80, y, 1120, y), fill=(120, 120, 120), width=3)
y += 40

sections = [
    (
        "APPETIZERS",
        [
            ("Roasted Tomato Soup", "$8.50", "tomato, cream, basil"),
            ("Truffle Fries", "$11.00", "potato, truffle oil, parmesan"),
        ],
    ),
    (
        "MAINS",
        [
            ("Grilled Salmon", "$24.99", "salmon, lemon butter, asparagus"),
            (
                "Wild Mushroom Risotto",
                "$19.75",
                "arborio rice, mushroom, parmesan",
            ),
        ],
    ),
    (
        "DESSERT",
        [
            (
                "Vanilla Bean Cheesecake",
                "$9.25",
                "cream cheese, vanilla, berry compote",
            )
        ],
    ),
]

for section, items in sections:
    d.text((80, y), section, fill=(25, 25, 25), font=heading_font)
    y += 58
    for name, price, desc in items:
        d.text((100, y), name, fill=(20, 20, 20), font=body_font)
        d.text((1000, y), price, fill=(20, 20, 20), font=body_font)
        y += 42
        d.text((120, y), desc, fill=(95, 95, 95), font=body_font)
        y += 62
    y += 25

out = "test-data/menu-test.png"
img.save(out, format="PNG")
print(out)

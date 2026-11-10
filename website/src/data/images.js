// Every photo on the website, in one place. To use a real photo instead of the
// AI-generated one: put it in website/public/images/ and change `src`, set
// `illustrative: false`, and update the alt text.
export const IMAGES = {
  receiptBook: {
    src: "/images/receipt-book.jpg",
    illustrative: true,
    alt: {
      en: "A carbon-copy receipt book with handwritten Arabic entries on a plant office desk",
      ar: "دفتر إيصالات بنسخ كربونية عليه قيود مكتوبة بخط اليد بالعربية على مكتب في مصنع",
    },
  },
  cementPlant: {
    src: "/images/cement-plant.jpg",
    illustrative: true,
    alt: { en: "A cement plant in the Egyptian desert at golden hour", ar: "مصنع أسمنت في الصحراء المصرية وقت الغروب" },
  },
  suezShip: {
    src: "/images/suez-ship.jpg",
    illustrative: true,
    alt: { en: "A container ship sailing through the Suez Canal at dawn", ar: "سفينة حاويات تعبر قناة السويس عند الفجر" },
  },
};

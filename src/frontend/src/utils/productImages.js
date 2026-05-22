export const PRODUCT_IMAGES = {
  'MacBook Pro 14"':
    'https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111902_mbp14-silver2.png',
  'iPhone 15 Pro':
    'https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-15-pro-max.png',
  'iPad Air':
    'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-finish-select-gallery-202405-13inch-blue-wifi?wid=5120&hei=2880&fmt=p-jpg&qlt=80&sp=yes&strip=yes&trim&ex=536&ey=402&align=center&resizesource&unsharp=1.5x1+0.7+0.02&cox=0&coy=0&cdx=536&cdy=402',
  'AirPods Pro':
    'https://productimages.hepsiburada.net/s/337/375-375/110000088116931.jpg',
  'Dell XPS 13':
    'https://m.media-amazon.com/images/I/710EGJBdIML._AC_UF894,1000_QL80_.jpg',
  'Samsung Galaxy S24':
    'https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_135895764?x=536&y=402&format=jpg&quality=80&sp=yes&strip=yes&trim&ex=536&ey=402&align=center&resizesource&unsharp=1.5x1+0.7+0.02&cox=0&coy=0&cdx=536&cdy=402',
  'Magic Keyboard':
    'https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/148699-1_large.jpg',
  'Lenovo ThinkPad':
    'https://p1-ofp.static.pub/fes/cms/2023/02/13/5tlm0hunv3l71hzse5hlxsafgw4aw0954514.png',
};

export const getProductImage = (productName) => PRODUCT_IMAGES[productName] || null;

import type {
  AmenityPackageComposition,
  AmenityProduct,
} from './amenityQuantityTypes'

/**
 * Amenity master + package compositions from GC-SGN ECO (A321/A330 sheets).
 * Built from amenity_master_data.json — numeric package qty only (zeros omitted).
 * String cadence notes live in DEFAULT_PERIODIC_TOPUP_ITEMS.
 */

export const DEFAULT_AMENITY_PRODUCTS: AmenityProduct[] = [
  {
    "code": "30000290",
    "name": "Túi đựng rác xanh to",
    "unit": "cái",
    "spec": "10 cái/kg",
    "price": 52640
  },
  {
    "code": "30000879",
    "name": "Túi rác dây rút trung",
    "unit": "cái",
    "spec": "20 cái/kg",
    "price": 72500
  },
  {
    "code": "30000301",
    "name": "Túi đựng rác xanh nhỏ",
    "unit": "cái",
    "spec": "40 cái/kg",
    "price": 47000
  },
  {
    "code": "30000642",
    "name": "Túi rác xanh Cockpit",
    "unit": "cái",
    "spec": "75 cái/kg",
    "price": 52640
  },
  {
    "code": "30000178",
    "name": "Túi nilon VJA - PE lớn",
    "unit": "cái",
    "spec": null,
    "price": 2650
  },
  {
    "code": "30000289",
    "name": "Túi nilon VJA - PE nhỏ",
    "unit": "cái",
    "spec": null,
    "price": 965
  },
  {
    "code": "30005621",
    "name": "Ly giấy VJ-Vikkafe",
    "unit": "cái",
    "spec": "25 cái/lốc",
    "price": 865
  },
  {
    "code": "30000099",
    "name": "Găng tay nilon",
    "unit": "Hộp",
    "spec": "50 đôi/hộp",
    "price": 21800
  },
  {
    "code": "30000630",
    "name": "Khăn giấy ăn in logo Vietjet",
    "unit": "bịch",
    "spec": "50 tờ/bịch",
    "price": 6500
  },
  {
    "code": "30000641",
    "name": "Khăn giấy bịch (lau tay)",
    "unit": "hộp",
    "spec": "100 tờ/bịch",
    "price": 11000
  },
  {
    "code": "30001144",
    "name": "Giấy vệ sinh An An",
    "unit": "cuộn",
    "spec": null,
    "price": 5718
  },
  {
    "code": "30000123",
    "name": "Đường",
    "unit": "que",
    "spec": null,
    "price": 380
  },
  {
    "code": "40000280",
    "name": "Đá viên",
    "unit": "kg",
    "spec": "5kg/bịch",
    "price": "VINACS:\t 3,500 \nMASCO:\t 2,314 \nSASCO:\t 5,000 \nSGN:\t 1,400"
  },
  {
    "code": "30000589",
    "name": "Ống hút",
    "unit": "cái",
    "spec": "50 cái/bịch",
    "price": 4050
  },
  {
    "code": "30000590",
    "name": "Cây khuấy",
    "unit": "cái",
    "spec": null,
    "price": 750
  },
  {
    "code": "30000591",
    "name": "Túi nôn",
    "unit": "cái",
    "spec": null,
    "price": 714
  },
  {
    "code": "30000424",
    "name": "Seal",
    "unit": "cái",
    "spec": null,
    "price": 1150
  },
  {
    "code": "30001237",
    "name": "Ly trà sữa",
    "unit": "cái",
    "spec": null,
    "price": 1308
  },
  {
    "code": "30001241",
    "name": "Nắp trà sữa",
    "unit": "cái",
    "spec": null,
    "price": 576
  },
  {
    "code": "30001231",
    "name": "Ống hút trà sữa Oolong trân châu",
    "unit": "cái",
    "spec": null,
    "price": 250
  },
  {
    "code": "30000100",
    "name": "Nước suối Dasani 1500ml",
    "unit": "chai",
    "spec": "6 chai/lốc",
    "price": 4546
  },
  {
    "code": "30000312",
    "name": "Khăn giấy ướt Nuna",
    "unit": "bịch",
    "spec": null,
    "price": 19091
  },
  {
    "code": "30000256",
    "name": "Bình xịt Fresh&clear",
    "unit": "chai",
    "spec": null,
    "price": 81000
  },
  {
    "code": "30001233",
    "name": "Bình xịt khử mùi",
    "unit": "chai",
    "spec": null,
    "price": 136000
  },
  {
    "code": "30000267",
    "name": "Bình xịt côn trùng top of decent",
    "unit": "Chai",
    "spec": null,
    "price": 291000
  },
  {
    "code": "30000628",
    "name": "Bình xịt côn trùng Pre-spray",
    "unit": "Chai",
    "spec": null,
    "price": 291000
  },
  {
    "code": "30000648",
    "name": "Sáp thơm",
    "unit": "cái",
    "spec": null,
    "price": 111500
  },
  {
    "code": "30001055",
    "name": "Tinh dầu lav Business",
    "unit": "bộ",
    "spec": null,
    "price": 80000
  },
  {
    "code": "AM001",
    "name": "Chai xà phòng chiết",
    "unit": "chai",
    "spec": null,
    "price": null
  },
  {
    "code": "30000651",
    "name": "Hoa lavatory",
    "unit": "cái",
    "spec": null,
    "price": null
  },
  {
    "code": "30005963",
    "name": "Đế bình xà phòng",
    "unit": "cái",
    "spec": null,
    "price": null
  },
  {
    "code": "30000435",
    "name": "Bình đựng sữa rửa tay",
    "unit": "cái",
    "spec": null,
    "price": null
  },
  {
    "code": "30001141",
    "name": "Bình đựng xà phòng Skyboss",
    "unit": "cái",
    "spec": null,
    "price": null
  },
  {
    "code": "30003142",
    "name": "Bảng hướng dẫn khu vực Skyboss",
    "unit": "cái",
    "spec": null,
    "price": null
  },
  {
    "code": "30003143",
    "name": "Bảng hướng dẫn khu vực Business",
    "unit": "cái",
    "spec": null,
    "price": null
  }
]

export const DEFAULT_AMENITY_PACKAGE_COMPOSITIONS: AmenityPackageComposition[] = [
  {
    "packageId": 1,
    "items": [
      {
        "productCode": "30000099",
        "quantity": 2
      },
      {
        "productCode": "30000630",
        "quantity": 2
      },
      {
        "productCode": "30000641",
        "quantity": 4
      },
      {
        "productCode": "30001144",
        "quantity": 8
      },
      {
        "productCode": "30000589",
        "quantity": 50
      },
      {
        "productCode": "30000424",
        "quantity": 8
      },
      {
        "productCode": "30001231",
        "quantity": 15
      }
    ]
  },
  {
    "packageId": 2,
    "items": [
      {
        "productCode": "30000879",
        "quantity": 3
      },
      {
        "productCode": "30000301",
        "quantity": 1
      },
      {
        "productCode": "30000642",
        "quantity": 2
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 2
      },
      {
        "productCode": "30005621",
        "quantity": 25
      },
      {
        "productCode": "30000630",
        "quantity": 2
      },
      {
        "productCode": "30000641",
        "quantity": 1
      },
      {
        "productCode": "30001144",
        "quantity": 1
      },
      {
        "productCode": "30000123",
        "quantity": 3
      },
      {
        "productCode": "40000280",
        "quantity": 5
      },
      {
        "productCode": "30000590",
        "quantity": 3
      },
      {
        "productCode": "30000591",
        "quantity": 5
      }
    ]
  },
  {
    "packageId": 3,
    "items": [
      {
        "productCode": "30000879",
        "quantity": 4
      },
      {
        "productCode": "30000301",
        "quantity": 4
      },
      {
        "productCode": "30000642",
        "quantity": 2
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 4
      },
      {
        "productCode": "30005621",
        "quantity": 50
      },
      {
        "productCode": "30000630",
        "quantity": 3
      },
      {
        "productCode": "30000641",
        "quantity": 3
      },
      {
        "productCode": "30001144",
        "quantity": 2
      },
      {
        "productCode": "30000123",
        "quantity": 8
      },
      {
        "productCode": "40000280",
        "quantity": 10
      },
      {
        "productCode": "30000590",
        "quantity": 5
      },
      {
        "productCode": "30000591",
        "quantity": 10
      }
    ]
  },
  {
    "packageId": 4,
    "items": [
      {
        "productCode": "30000879",
        "quantity": 6
      },
      {
        "productCode": "30000301",
        "quantity": 2
      },
      {
        "productCode": "30000642",
        "quantity": 2
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 2
      },
      {
        "productCode": "30005621",
        "quantity": 50
      },
      {
        "productCode": "30000630",
        "quantity": 5
      },
      {
        "productCode": "30000641",
        "quantity": 6
      },
      {
        "productCode": "30001144",
        "quantity": 4
      },
      {
        "productCode": "30000123",
        "quantity": 8
      },
      {
        "productCode": "40000280",
        "quantity": 15
      },
      {
        "productCode": "30000590",
        "quantity": 5
      },
      {
        "productCode": "30000591",
        "quantity": 15
      }
    ]
  },
  {
    "packageId": 5,
    "items": [
      {
        "productCode": "30000290",
        "quantity": 4
      },
      {
        "productCode": "30000879",
        "quantity": 8
      },
      {
        "productCode": "30000301",
        "quantity": 6
      },
      {
        "productCode": "30000642",
        "quantity": 4
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 2
      },
      {
        "productCode": "30005621",
        "quantity": 75
      },
      {
        "productCode": "30000099",
        "quantity": 1
      },
      {
        "productCode": "30000630",
        "quantity": 7
      },
      {
        "productCode": "30000641",
        "quantity": 8
      },
      {
        "productCode": "30001144",
        "quantity": 6
      },
      {
        "productCode": "30000123",
        "quantity": 8
      },
      {
        "productCode": "40000280",
        "quantity": 20
      },
      {
        "productCode": "30000589",
        "quantity": 50
      },
      {
        "productCode": "30000590",
        "quantity": 5
      },
      {
        "productCode": "30000591",
        "quantity": 20
      },
      {
        "productCode": "30001231",
        "quantity": 10
      }
    ]
  },
  {
    "packageId": 6,
    "items": [
      {
        "productCode": "30000290",
        "quantity": 4
      },
      {
        "productCode": "30000879",
        "quantity": 8
      },
      {
        "productCode": "30000301",
        "quantity": 6
      },
      {
        "productCode": "30000642",
        "quantity": 4
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 2
      },
      {
        "productCode": "30005621",
        "quantity": 50
      },
      {
        "productCode": "30000099",
        "quantity": 1
      },
      {
        "productCode": "30000630",
        "quantity": 15
      },
      {
        "productCode": "30000641",
        "quantity": 8
      },
      {
        "productCode": "30001144",
        "quantity": 6
      },
      {
        "productCode": "30000123",
        "quantity": 8
      },
      {
        "productCode": "40000280",
        "quantity": 20
      },
      {
        "productCode": "30000590",
        "quantity": 5
      },
      {
        "productCode": "30000591",
        "quantity": 20
      }
    ]
  },
  {
    "packageId": 7,
    "items": [
      {
        "productCode": "30000290",
        "quantity": 12
      },
      {
        "productCode": "30000879",
        "quantity": 12
      },
      {
        "productCode": "30000301",
        "quantity": 15
      },
      {
        "productCode": "30000642",
        "quantity": 4
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 2
      },
      {
        "productCode": "30005621",
        "quantity": 600
      },
      {
        "productCode": "30000099",
        "quantity": 4
      },
      {
        "productCode": "30000630",
        "quantity": 25
      },
      {
        "productCode": "30000641",
        "quantity": 25
      },
      {
        "productCode": "30001144",
        "quantity": 12
      },
      {
        "productCode": "30000123",
        "quantity": 300
      },
      {
        "productCode": "40000280",
        "quantity": 20
      },
      {
        "productCode": "30000589",
        "quantity": 50
      },
      {
        "productCode": "30000590",
        "quantity": 16
      },
      {
        "productCode": "30000591",
        "quantity": 40
      },
      {
        "productCode": "30000424",
        "quantity": 20
      }
    ]
  },
  {
    "packageId": 8,
    "items": [
      {
        "productCode": "30000301",
        "quantity": 1
      },
      {
        "productCode": "30000642",
        "quantity": 1
      },
      {
        "productCode": "30005621",
        "quantity": 5
      },
      {
        "productCode": "30000630",
        "quantity": 1
      },
      {
        "productCode": "30000641",
        "quantity": 1
      },
      {
        "productCode": "30001144",
        "quantity": 1
      }
    ]
  },
  {
    "packageId": 9,
    "items": [
      {
        "productCode": "30000290",
        "quantity": 3
      },
      {
        "productCode": "30000879",
        "quantity": 4
      },
      {
        "productCode": "30000591",
        "quantity": 90
      }
    ]
  },
  {
    "packageId": 10,
    "items": [
      {
        "productCode": "30000099",
        "quantity": 3
      },
      {
        "productCode": "30000630",
        "quantity": 2
      },
      {
        "productCode": "30000641",
        "quantity": 8
      },
      {
        "productCode": "30001144",
        "quantity": 16
      },
      {
        "productCode": "30000589",
        "quantity": 50
      },
      {
        "productCode": "30001231",
        "quantity": 10
      }
    ]
  },
  {
    "packageId": 11,
    "items": [
      {
        "productCode": "30000290",
        "quantity": 2
      },
      {
        "productCode": "30000879",
        "quantity": 6
      },
      {
        "productCode": "30000301",
        "quantity": 2
      },
      {
        "productCode": "30000642",
        "quantity": 4
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 4
      },
      {
        "productCode": "30005621",
        "quantity": 50
      },
      {
        "productCode": "30000630",
        "quantity": 3
      },
      {
        "productCode": "30000641",
        "quantity": 2
      },
      {
        "productCode": "30001144",
        "quantity": 4
      },
      {
        "productCode": "30000123",
        "quantity": 8
      },
      {
        "productCode": "40000280",
        "quantity": 10
      },
      {
        "productCode": "30000590",
        "quantity": 5
      },
      {
        "productCode": "30000591",
        "quantity": 10
      }
    ]
  },
  {
    "packageId": 12,
    "items": [
      {
        "productCode": "30000290",
        "quantity": 4
      },
      {
        "productCode": "30000879",
        "quantity": 10
      },
      {
        "productCode": "30000301",
        "quantity": 7
      },
      {
        "productCode": "30000642",
        "quantity": 4
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 4
      },
      {
        "productCode": "30005621",
        "quantity": 100
      },
      {
        "productCode": "30000630",
        "quantity": 5
      },
      {
        "productCode": "30000641",
        "quantity": 4
      },
      {
        "productCode": "30001144",
        "quantity": 8
      },
      {
        "productCode": "30000123",
        "quantity": 15
      },
      {
        "productCode": "40000280",
        "quantity": 30
      },
      {
        "productCode": "30000590",
        "quantity": 8
      },
      {
        "productCode": "30000591",
        "quantity": 15
      },
      {
        "productCode": "30000424",
        "quantity": 20
      }
    ]
  },
  {
    "packageId": 13,
    "items": [
      {
        "productCode": "30000290",
        "quantity": 20
      },
      {
        "productCode": "30000879",
        "quantity": 25
      },
      {
        "productCode": "30000301",
        "quantity": 20
      },
      {
        "productCode": "30000642",
        "quantity": 4
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 4
      },
      {
        "productCode": "30005621",
        "quantity": 150
      },
      {
        "productCode": "30000099",
        "quantity": 4
      },
      {
        "productCode": "30000630",
        "quantity": 32
      },
      {
        "productCode": "30000641",
        "quantity": 25
      },
      {
        "productCode": "30001144",
        "quantity": 15
      },
      {
        "productCode": "30000123",
        "quantity": 15
      },
      {
        "productCode": "40000280",
        "quantity": 30
      },
      {
        "productCode": "30000589",
        "quantity": 75
      },
      {
        "productCode": "30000590",
        "quantity": 10
      },
      {
        "productCode": "30000591",
        "quantity": 35
      },
      {
        "productCode": "30000424",
        "quantity": 35
      },
      {
        "productCode": "30001231",
        "quantity": 5
      }
    ]
  },
  {
    "packageId": 14,
    "items": [
      {
        "productCode": "30000290",
        "quantity": 20
      },
      {
        "productCode": "30000879",
        "quantity": 25
      },
      {
        "productCode": "30000301",
        "quantity": 20
      },
      {
        "productCode": "30000642",
        "quantity": 4
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 4
      },
      {
        "productCode": "30005621",
        "quantity": 900
      },
      {
        "productCode": "30000099",
        "quantity": 4
      },
      {
        "productCode": "30000630",
        "quantity": 32
      },
      {
        "productCode": "30000641",
        "quantity": 25
      },
      {
        "productCode": "30001144",
        "quantity": 15
      },
      {
        "productCode": "30000123",
        "quantity": 500
      },
      {
        "productCode": "40000280",
        "quantity": 30
      },
      {
        "productCode": "30000589",
        "quantity": 75
      },
      {
        "productCode": "30000590",
        "quantity": 20
      },
      {
        "productCode": "30000591",
        "quantity": 35
      },
      {
        "productCode": "30000424",
        "quantity": 35
      },
      {
        "productCode": "30001231",
        "quantity": 5
      }
    ]
  },
  {
    "packageId": 15,
    "items": [
      {
        "productCode": "30000290",
        "quantity": 20
      },
      {
        "productCode": "30000879",
        "quantity": 25
      },
      {
        "productCode": "30000301",
        "quantity": 20
      },
      {
        "productCode": "30000642",
        "quantity": 4
      },
      {
        "productCode": "30000178",
        "quantity": 1
      },
      {
        "productCode": "30000289",
        "quantity": 4
      },
      {
        "productCode": "30005621",
        "quantity": 250
      },
      {
        "productCode": "30000099",
        "quantity": 4
      },
      {
        "productCode": "30000630",
        "quantity": 30
      },
      {
        "productCode": "30000641",
        "quantity": 25
      },
      {
        "productCode": "30001144",
        "quantity": 20
      },
      {
        "productCode": "30000123",
        "quantity": 25
      },
      {
        "productCode": "40000280",
        "quantity": 60
      },
      {
        "productCode": "30000589",
        "quantity": 75
      },
      {
        "productCode": "30000590",
        "quantity": 10
      },
      {
        "productCode": "30000591",
        "quantity": 35
      },
      {
        "productCode": "30000424",
        "quantity": 35
      },
      {
        "productCode": "30001231",
        "quantity": 25
      }
    ]
  },
  {
    "packageId": 16,
    "items": [
      {
        "productCode": "30000301",
        "quantity": 1
      },
      {
        "productCode": "30000642",
        "quantity": 1
      },
      {
        "productCode": "30005621",
        "quantity": 5
      },
      {
        "productCode": "30000630",
        "quantity": 1
      },
      {
        "productCode": "30000641",
        "quantity": 1
      },
      {
        "productCode": "30001144",
        "quantity": 1
      }
    ]
  },
  {
    "packageId": 17,
    "items": [
      {
        "productCode": "30000290",
        "quantity": 6
      },
      {
        "productCode": "30000879",
        "quantity": 8
      },
      {
        "productCode": "30000591",
        "quantity": 160
      }
    ]
  }
]

export const DEFAULT_PERIODIC_TOPUP_ITEMS: Array<{
  productCode: string
  cadenceNote: string
}> = [
  {
    "productCode": "30000312",
    "cadenceNote": "3 bich/tàu/ thứ 5 hàng tuần"
  },
  {
    "productCode": "30000256",
    "cadenceNote": "1 chai/tàu/ thứ 5 hàng tuần"
  },
  {
    "productCode": "30001233",
    "cadenceNote": "1 chai/tàu/ thứ 5 hàng tuần"
  },
  {
    "productCode": "30000267",
    "cadenceNote": "Tùy bay đến sân bay nào thì IFS sẽ cấp theo qui định"
  },
  {
    "productCode": "30000628",
    "cadenceNote": "Tùy bay đến sân bay nào thì IFS sẽ cấp theo qui định"
  },
  {
    "productCode": "30000648",
    "cadenceNote": "topup ngày 1 và 15 hàng tháng, sl 1 cái/lavatory"
  },
  {
    "productCode": "AM001",
    "cadenceNote": "2 chai/tàu/ thứ 5 hàng tuần"
  },
  {
    "productCode": "30000100",
    "cadenceNote": "Tùy theo số chặng bay/số TV để load số lượng"
  },
  {
    "productCode": "30000312",
    "cadenceNote": "6 bich/tàu/ thứ 5 hàng tuần"
  },
  {
    "productCode": "30000256",
    "cadenceNote": "3 chai/tàu/thứ 5 hàng tuần"
  },
  {
    "productCode": "30001233",
    "cadenceNote": " 3 chai/tàu/thứ 5 hàng tuần"
  },
  {
    "productCode": "30000648",
    "cadenceNote": "topup ngày 1 và 15 hàng tháng, sl 1 cái/lavatory Eco"
  },
  {
    "productCode": "30001055",
    "cadenceNote": "topup ngày 01 mỗi tháng, Sl 1 cái/Lav Skyboss và Business"
  },
  {
    "productCode": "AM001",
    "cadenceNote": "3 chai/tàu/ thứ 5 hàng tuần"
  }
]

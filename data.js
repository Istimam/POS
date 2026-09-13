const RESTAURANT_DATA = {
    "offices": [
        {
            "id": "O1",
            "name": "Dhanmondi Office"
        },
        {
            "id": "O2",
            "name": "Gulshan Office"
        }
    ],
    "warehouses": [
        {
            "id": "W1",
            "officeId": "O1",
            "name": "Dhanmondi Warehouse"
        },
        {
            "id": "W2",
            "officeId": "O1",
            "name": "Dhanmondi Store 2"
        },
        {
            "id": "W3",
            "officeId": "O2",
            "name": "Gulshan Central Store"
        }
    ],
    "kitchens": [
        {
            "id": 1,
            "officeId": "O1",
            "warehouseId": "W1",
            "name": "Bangla Kitchen",
            "status": "Active",
            "assignedItems": 12
        },
        {
            "id": 2,
            "officeId": "O1",
            "warehouseId": "W1",
            "name": "Chinese Kitchen",
            "status": "Active",
            "assignedItems": 8
        },
        {
            "id": 3,
            "officeId": "O1",
            "warehouseId": "W2",
            "name": "Fast Food Counter",
            "status": "Inactive",
            "assignedItems": 5
        },
        {
            "id": 4,
            "officeId": "O2",
            "warehouseId": "W3",
            "name": "Gulshan Main Kitchen",
            "status": "Active",
            "assignedItems": 0
        }
    ],
    "kitchenItemMappings": [],
    "floors": [
        {
            "id": "floor_ground",
            "name": "Ground Floor Dining",
            "style": "standard",
            "width": 900,
            "height": 600
        },
        {
            "id": "floor_vip",
            "name": "1st Floor VIP Lounge",
            "style": "lshape",
            "width": 900,
            "height": 600
        },
        {
            "id": "floor_terrace",
            "name": "Rooftop Garden",
            "style": "courtyard",
            "width": 900,
            "height": 600
        }
    ],
    "tables": [
        {
            "id": "t1",
            "name": "T-01",
            "floorId": "floor_ground",
            "shape": "round",
            "capacity": 4,
            "status": "AVAILABLE",
            "x": 40,
            "y": 40
        },
        {
            "id": "t2",
            "name": "T-02",
            "floorId": "floor_ground",
            "shape": "square",
            "capacity": 2,
            "status": "RESERVED",
            "reservation": {
                "name": "Rahat Ahmed",
                "phone": "01711223344",
                "date": "2026-09-05",
                "time": "19:30",
                "guests": 2
            },
            "x": 220,
            "y": 40
        },
        {
            "id": "t3",
            "name": "T-03",
            "floorId": "floor_ground",
            "shape": "rectangle",
            "capacity": 6,
            "status": "OCCUPIED",
            "orderId": "INV-18260905-0042",
            "x": 380,
            "y": 40
        },
        {
            "id": "t4",
            "name": "T-04",
            "floorId": "floor_ground",
            "shape": "oval",
            "capacity": 8,
            "status": "AVAILABLE",
            "x": 580,
            "y": 40
        },
        {
            "id": "t5",
            "name": "T-05",
            "floorId": "floor_ground",
            "shape": "rectangle",
            "capacity": 6,
            "status": "AVAILABLE",
            "x": 120,
            "y": 240
        },
        {
            "id": "t6",
            "name": "T-06",
            "floorId": "floor_ground",
            "shape": "round",
            "capacity": 4,
            "status": "OCCUPIED",
            "orderId": "INV-18260905-0048",
            "x": 360,
            "y": 240
        },
        {
            "id": "vip1",
            "name": "VIP-01",
            "floorId": "floor_vip",
            "shape": "rectangle",
            "capacity": 12,
            "status": "RESERVED",
            "reservation": {
                "name": "Dr. Tanvir",
                "phone": "01899001122",
                "date": "2026-09-05",
                "time": "20:00",
                "guests": 10
            },
            "x": 80,
            "y": 60
        },
        {
            "id": "vip2",
            "name": "VIP-02",
            "floorId": "floor_vip",
            "shape": "oval",
            "capacity": 8,
            "status": "AVAILABLE",
            "x": 400,
            "y": 60
        },
        {
            "id": "ter1",
            "name": "Terrace-A",
            "floorId": "floor_terrace",
            "shape": "round",
            "capacity": 4,
            "status": "AVAILABLE",
            "x": 100,
            "y": 80
        },
        {
            "id": "ter2",
            "name": "Terrace-B",
            "floorId": "floor_terrace",
            "shape": "round",
            "capacity": 4,
            "status": "AVAILABLE",
            "x": 320,
            "y": 80
        }
    ],
    "openOrders": [
        {
            "id": "INV-18260905-0042",
            "tableId": "t3",
            "tableName": "T-03",
            "orderType": "Dine-In",
            "status": "OPEN",
            "cart": [
                {
                    "key": "206_",
                    "productId": 206,
                    "name": "Plain Nazirshail Rice",
                    "price": 40,
                    "qty": 3,
                    "options": [],
                    "maxStock": 120
                },
                {
                    "key": "204_",
                    "productId": 204,
                    "name": "Deshi Chicken Curry",
                    "price": 220,
                    "qty": 2,
                    "options": [],
                    "maxStock": 14
                },
                {
                    "key": "106_",
                    "productId": 106,
                    "name": "Special Milk Dudh Cha",
                    "price": 20,
                    "qty": 3,
                    "options": [],
                    "maxStock": 85
                }
            ],
            "discountPercent": 0,
            "vatPercent": 5,
            "createdAt": "02:45 PM"
        },
        {
            "id": "INV-18260905-0048",
            "tableId": "t6",
            "tableName": "T-06",
            "orderType": "Dine-In",
            "status": "OPEN",
            "cart": [
                {
                    "key": "301_",
                    "productId": 301,
                    "name": "Old Dhaka Kacchi Biryani",
                    "price": 340,
                    "qty": 2,
                    "options": [
                        "Full Portion"
                    ],
                    "maxStock": 22
                },
                {
                    "key": "304_",
                    "productId": 304,
                    "name": "Chilled Borhani Glass",
                    "price": 60,
                    "qty": 2,
                    "options": [],
                    "maxStock": 45
                }
            ],
            "discountPercent": 5,
            "vatPercent": 5,
            "createdAt": "03:10 PM"
        }
    ],
    "dayparts": [
        {
            "id": "breakfast",
            "name": "Morning Breakfast",
            "icon": "sun",
            "emoji": "🌅",
            "startTime": "06:00",
            "endTime": "11:00",
            "timeDisplay": "(06:00 AM - 11:00 AM)",
            "description": "Showing auto-sequenced breakfast paratha, bhaji, tea & morning specials",
            "days": [
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat"
            ],
            "enabled": true
        },
        {
            "id": "lunch",
            "name": "Afternoon Lunch",
            "icon": "utensils",
            "emoji": "🍚",
            "startTime": "11:00",
            "endTime": "16:00",
            "timeDisplay": "(11:00 AM - 04:00 PM)",
            "description": "Showing lunch rice, fish curry, chicken, mutton, bhorta & dal",
            "days": [
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Sat"
            ],
            "enabled": true
        },
        {
            "id": "friday_lunch",
            "name": "Friday Special Lunch",
            "icon": "sparkles",
            "emoji": "🕌",
            "startTime": "12:00",
            "endTime": "16:00",
            "timeDisplay": "(12:00 PM - 04:00 PM)",
            "description": "Showing Friday Special Kacchi Biryani, Borhani, Roast & Tehari",
            "days": [
                "Fri"
            ],
            "enabled": true
        },
        {
            "id": "evening",
            "name": "Evening Snacks & Grill",
            "icon": "flame",
            "emoji": "🍢",
            "startTime": "16:00",
            "endTime": "20:00",
            "timeDisplay": "(04:00 PM - 08:00 PM)",
            "description": "Showing evening grill chicken, naan, shawarma & fried items",
            "days": [
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat"
            ],
            "enabled": true
        },
        {
            "id": "night",
            "name": "Night Dinner",
            "icon": "moon",
            "emoji": "🌙",
            "startTime": "20:00",
            "endTime": "24:00",
            "timeDisplay": "(08:00 PM - 12:00 AM)",
            "description": "Showing late-night dinner rice, khichuri, mutton curry & desserts",
            "days": [
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat"
            ],
            "enabled": true
        }
    ],
    "categories": [
        {
            "id": "cat_paratha",
            "name": "Paratha & Breads",
            "icon": "🫓",
            "dayparts": [
                "breakfast",
                "night"
            ]
        },
        {
            "id": "cat_bhaji",
            "name": "Eggs & Bhaji",
            "icon": "🍳",
            "dayparts": [
                "breakfast"
            ]
        },
        {
            "id": "cat_rice",
            "name": "Rice & Kacchi",
            "icon": "🍚",
            "dayparts": [
                "lunch",
                "friday_lunch",
                "night"
            ]
        },
        {
            "id": "cat_fish",
            "name": "Fish & Bhorta",
            "icon": "🐟",
            "dayparts": [
                "lunch",
                "night"
            ]
        },
        {
            "id": "cat_meat",
            "name": "Chicken & Mutton",
            "icon": "🍗",
            "dayparts": [
                "lunch",
                "friday_lunch",
                "night"
            ]
        },
        {
            "id": "cat_grill",
            "name": "Grill & BBQ",
            "icon": "🍢",
            "dayparts": [
                "evening"
            ]
        },
        {
            "id": "cat_snacks",
            "name": "Shawarma & Fried",
            "icon": "🌯",
            "dayparts": [
                "evening"
            ]
        },
        {
            "id": "cat_tea",
            "name": "Tea & Beverages",
            "icon": "☕",
            "dayparts": [
                "breakfast",
                "lunch",
                "evening",
                "night"
            ]
        },
        {
            "id": "cat_sweets",
            "name": "Halwa & Sweets",
            "icon": "🍨",
            "dayparts": [
                "breakfast",
                "lunch",
                "night"
            ]
        }
    ],
    "products": [
        {
            "id": 101,
            "is_kitchen": true,
            "code": "BF-01",
            "name": "Special Butter Paratha",
            "catId": "cat_paratha",
            "price": 25,
            "origPrice": 30,
            "discountPercent": 15,
            "stock": 24,
            "avatar": "🫓",
            "dayparts": [
                "breakfast",
                "night"
            ],
            "salesCount": 420,
            "isPinned": true,
            "hasModifiers": true,
            "enabled": true
        },
        {
            "id": 102,
            "is_kitchen": true,
            "code": "BF-02",
            "name": "Plain Paratha",
            "catId": "cat_paratha",
            "price": 15,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 0,
            "avatar": "🫓",
            "dayparts": [
                "breakfast",
                "night"
            ],
            "salesCount": 380,
            "isPinned": false,
            "enabled": true
        },
        {
            "id": 103,
            "is_kitchen": true,
            "code": "BF-03",
            "name": "Mixed Vegetable Bhaji",
            "catId": "cat_bhaji",
            "price": 40,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 12,
            "avatar": "🥗",
            "dayparts": [
                "breakfast"
            ],
            "salesCount": 290,
            "isPinned": true,
            "enabled": true
        },
        {
            "id": 104,
            "is_kitchen": true,
            "code": "BF-04",
            "name": "Egg Mamlet / Poach",
            "catId": "cat_bhaji",
            "price": 30,
            "origPrice": 35,
            "discountPercent": 14,
            "stock": 18,
            "avatar": "🍳",
            "dayparts": [
                "breakfast"
            ],
            "salesCount": 310,
            "hasModifiers": true,
            "enabled": true
        },
        {
            "id": 105,
            "is_kitchen": true,
            "code": "BF-05",
            "name": "Thick Yellow Daal Fry",
            "catId": "cat_bhaji",
            "price": 35,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 4,
            "avatar": "🥣",
            "dayparts": [
                "breakfast"
            ],
            "salesCount": 180,
            "enabled": true
        },
        {
            "id": 106,
            "is_kitchen": false,
            "code": "BF-06",
            "name": "Special Milk Dudh Cha",
            "catId": "cat_tea",
            "price": 20,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 85,
            "avatar": "☕",
            "dayparts": [
                "breakfast",
                "lunch",
                "evening",
                "night"
            ],
            "salesCount": 550,
            "isPinned": true,
            "enabled": true
        },
        {
            "id": 107,
            "is_kitchen": true,
            "code": "BF-07",
            "name": "Special Suji Halwa",
            "catId": "cat_sweets",
            "price": 45,
            "origPrice": 50,
            "discountPercent": 10,
            "stock": 15,
            "avatar": "🍨",
            "dayparts": [
                "breakfast"
            ],
            "salesCount": 140,
            "enabled": true
        },
        {
            "id": 201,
            "is_kitchen": true,
            "code": "LN-01",
            "name": "Shorshe Ilish (Hilsa)",
            "catId": "cat_fish",
            "price": 320,
            "origPrice": 360,
            "discountPercent": 11,
            "stock": 5,
            "avatar": "🐟",
            "dayparts": [
                "lunch",
                "night"
            ],
            "salesCount": 210,
            "isPinned": true,
            "enabled": true
        },
        {
            "id": 202,
            "is_kitchen": true,
            "code": "LN-02",
            "name": "Rui Fish Curry",
            "catId": "cat_fish",
            "price": 180,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 0,
            "avatar": "🐠",
            "dayparts": [
                "lunch",
                "night"
            ],
            "salesCount": 160,
            "enabled": true
        },
        {
            "id": 203,
            "is_kitchen": true,
            "code": "LN-03",
            "name": "Aloo Bhorta & Shutki",
            "catId": "cat_fish",
            "price": 50,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 30,
            "avatar": "🥔",
            "dayparts": [
                "lunch",
                "night"
            ],
            "salesCount": 340,
            "isPinned": true,
            "enabled": true
        },
        {
            "id": 204,
            "is_kitchen": true,
            "code": "LN-04",
            "name": "Deshi Chicken Curry",
            "catId": "cat_meat",
            "price": 220,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 14,
            "avatar": "🍗",
            "dayparts": [
                "lunch",
                "night"
            ],
            "salesCount": 390,
            "isPinned": true,
            "enabled": true
        },
        {
            "id": 205,
            "is_kitchen": true,
            "code": "LN-05",
            "name": "Khasir (Mutton) Bhuna",
            "catId": "cat_meat",
            "price": 380,
            "origPrice": 420,
            "discountPercent": 10,
            "stock": 8,
            "avatar": "🍖",
            "dayparts": [
                "lunch",
                "night"
            ],
            "salesCount": 280,
            "hasModifiers": true,
            "enabled": true
        },
        {
            "id": 206,
            "is_kitchen": true,
            "code": "LN-06",
            "name": "Plain Nazirshail Rice",
            "catId": "cat_rice",
            "price": 40,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 120,
            "avatar": "🍚",
            "dayparts": [
                "lunch",
                "night"
            ],
            "salesCount": 600,
            "enabled": true
        },
        {
            "id": 301,
            "is_kitchen": true,
            "code": "FR-01",
            "name": "Old Dhaka Kacchi Biryani",
            "catId": "cat_rice",
            "price": 340,
            "origPrice": 380,
            "discountPercent": 10,
            "stock": 22,
            "avatar": "🍛",
            "dayparts": [
                "lunch",
                "friday_lunch"
            ],
            "salesCount": 750,
            "isPinned": true,
            "hasModifiers": true,
            "enabled": true
        },
        {
            "id": 302,
            "is_kitchen": true,
            "code": "FR-02",
            "name": "Chicken Roast & Polao",
            "catId": "cat_rice",
            "price": 280,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 16,
            "avatar": "🍗",
            "dayparts": [
                "lunch",
                "friday_lunch"
            ],
            "salesCount": 520,
            "hasModifiers": true,
            "enabled": true
        },
        {
            "id": 303,
            "is_kitchen": true,
            "code": "FR-03",
            "name": "Special Beef Tehari",
            "catId": "cat_rice",
            "price": 220,
            "origPrice": 260,
            "discountPercent": 15,
            "stock": 19,
            "avatar": "🍲",
            "dayparts": [
                "lunch",
                "friday_lunch",
                "night"
            ],
            "salesCount": 480,
            "isPinned": true,
            "hasModifiers": true,
            "enabled": true
        },
        {
            "id": 304,
            "is_kitchen": false,
            "code": "FR-04",
            "name": "Chilled Borhani Glass",
            "catId": "cat_tea",
            "price": 60,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 45,
            "avatar": "🥛",
            "dayparts": [
                "lunch",
                "friday_lunch"
            ],
            "salesCount": 410,
            "enabled": true
        },
        {
            "id": 401,
            "is_kitchen": true,
            "code": "EV-01",
            "name": "Full Chicken Grill",
            "catId": "cat_grill",
            "price": 480,
            "origPrice": 540,
            "discountPercent": 11,
            "stock": 6,
            "avatar": "🍗",
            "dayparts": [
                "evening"
            ],
            "salesCount": 310,
            "isPinned": true,
            "hasModifiers": true,
            "enabled": true
        },
        {
            "id": 402,
            "is_kitchen": true,
            "code": "EV-02",
            "name": "Quarter Chicken Grill",
            "catId": "cat_grill",
            "price": 130,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 0,
            "avatar": "🍖",
            "dayparts": [
                "evening"
            ],
            "salesCount": 460,
            "enabled": true
        },
        {
            "id": 403,
            "is_kitchen": true,
            "code": "EV-03",
            "name": "Special Butter Naan",
            "catId": "cat_grill",
            "price": 35,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 50,
            "avatar": "🫓",
            "dayparts": [
                "evening"
            ],
            "salesCount": 520,
            "enabled": true
        },
        {
            "id": 404,
            "is_kitchen": true,
            "code": "EV-04",
            "name": "Beef Sheek Kebab",
            "catId": "cat_grill",
            "price": 160,
            "origPrice": 180,
            "discountPercent": 11,
            "stock": 12,
            "avatar": "🍢",
            "dayparts": [
                "evening"
            ],
            "salesCount": 270,
            "isPinned": true,
            "enabled": true
        },
        {
            "id": 405,
            "is_kitchen": true,
            "code": "EV-05",
            "name": "Chicken Shawarma Roll",
            "catId": "cat_snacks",
            "price": 120,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 25,
            "avatar": "🌯",
            "dayparts": [
                "evening"
            ],
            "salesCount": 390,
            "enabled": true
        },
        {
            "id": 406,
            "is_kitchen": true,
            "code": "EV-06",
            "name": "Crispy Fried Chicken (2pcs)",
            "catId": "cat_snacks",
            "price": 180,
            "origPrice": 200,
            "discountPercent": 10,
            "stock": 15,
            "avatar": "🍗",
            "dayparts": [
                "evening"
            ],
            "salesCount": 220,
            "enabled": true
        },
        {
            "id": 501,
            "is_kitchen": true,
            "code": "NT-01",
            "name": "Bhuna Khichuri & Beef",
            "catId": "cat_rice",
            "price": 260,
            "origPrice": null,
            "discountPercent": 0,
            "stock": 18,
            "avatar": "🍲",
            "dayparts": [
                "night"
            ],
            "salesCount": 380,
            "isPinned": true,
            "hasModifiers": true,
            "enabled": true
        },
        {
            "id": 502,
            "is_kitchen": true,
            "code": "NT-02",
            "name": "Duck Bhuna (Haash)",
            "catId": "cat_meat",
            "price": 350,
            "origPrice": 380,
            "discountPercent": 8,
            "stock": 7,
            "avatar": "🦆",
            "dayparts": [
                "night"
            ],
            "salesCount": 190,
            "enabled": true
        }
    ]
};

// ── PERSISTENCE ───────────────────────────────────────────────────────────
// Load from localStorage if exists
if (typeof window !== 'undefined' && window.localStorage) {
    const savedMappings = localStorage.getItem('kitchenItemMappings_v2');
    if (savedMappings) {
        RESTAURANT_DATA.kitchenItemMappings = JSON.parse(savedMappings);
    }
    
    const savedKitchens = localStorage.getItem('kitchens_v2');
    if (savedKitchens) {
        RESTAURANT_DATA.kitchens = JSON.parse(savedKitchens);
    }

    // Override the push/filter methods or just require pages to save it
    // The easiest way is to add a saveData() function to window
    window.saveKitchenData = function() {
        localStorage.setItem('kitchenItemMappings_v2', JSON.stringify(RESTAURANT_DATA.kitchenItemMappings));
        localStorage.setItem('kitchens_v2', JSON.stringify(RESTAURANT_DATA.kitchens));
    };
}

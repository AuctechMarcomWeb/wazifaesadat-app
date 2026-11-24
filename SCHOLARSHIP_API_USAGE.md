# Scholarship API Usage Guide - WazifaESadat App

## 📂 File Location
`src/api/scholarship.js`

---

## 🎓 SCHOLARSHIP DATE API

### Import
```javascript
import {
  getScholarshipDates,
  getScholarshipDatesByCategory,
  createScholarshipDate,
  updateScholarshipDate,
  deleteScholarshipDate,
} from '../api/scholarship';
```

### Functions

#### 1. Get All Scholarship Dates
```javascript
const data = await getScholarshipDates(
  page = 1,          // Page number
  limit = 50,        // Records per page
  search = '',       // Search term (optional)
  isActive = true    // Filter by active (optional)
);

// Response:
// {
//   scholarshipDates: [...],
//   totalRecords: number,
//   totalPages: number,
//   currentPage: number
// }
```

#### 2. Get Scholarship Dates by Category
```javascript
const data = await getScholarshipDatesByCategory(
  'Junior',          // Category: 'Junior', 'Senior', etc.
  true               // isActive (optional)
);
```

#### 3. Create Scholarship Date
```javascript
const result = await createScholarshipDate({
  category: 'Junior',
  startDate: '2026-11-20',    // YYYY-MM-DD format
  endDate: '2026-11-27',      // YYYY-MM-DD format
  remarks: 'Junior Scholarship 2026',
  isActive: true
});
```

#### 4. Update Scholarship Date
```javascript
const result = await updateScholarshipDate(
  'scholarshipDateId',  // ID from API
  {
    remarks: 'Updated remarks',
    endDate: '2026-12-31'
  }
);
```

#### 5. Delete Scholarship Date
```javascript
const result = await deleteScholarshipDate('scholarshipDateId');
```

---

## 💰 SCHOLARSHIP RATE API

### Import
```javascript
import {
  getScholarshipRates,
  getScholarshipRateById,
  createScholarshipRate,
  updateScholarshipRate,
  deleteScholarshipRate,
} from '../api/scholarship';
```

### Functions

#### 1. Get All Scholarship Rates
```javascript
const data = await getScholarshipRates(
  page = 1,          // Page number
  limit = 50,        // Records per page
  search = '',       // Search term (optional)
  isActive = true    // Filter by active (optional)
);

// Response:
// {
//   courseWithRates: [...],  // or similar structure
//   totalRecords: number,
//   totalPages: number,
//   currentPage: number
// }
```

#### 2. Get Scholarship Rate by ID
```javascript
const data = await getScholarshipRateById('rateId');
```

#### 3. Create Scholarship Rate
```javascript
const result = await createScholarshipRate({
  courseName: 'Islamic Studies',
  rate: 5000,              // Amount
  remarks: 'Standard rate for Islamic Studies',
  isActive: true
});
```

#### 4. Update Scholarship Rate
```javascript
const result = await updateScholarshipRate(
  'rateId',
  {
    rate: 6000,
    remarks: 'Updated rate'
  }
);
```

#### 5. Delete Scholarship Rate
```javascript
const result = await deleteScholarshipRate('rateId');
```

---

## ✅ Usage Examples in Components

### Example 1: Fetch data on component mount
```javascript
import { getScholarshipDates } from '../api/scholarship';
import { useFocusEffect } from '@react-navigation/native';

const MyComponent = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getScholarshipDates(1, 50, '', true);
      setScholarships(response.scholarshipDates || []);
    } catch (error) {
      console.error('Failed to load:', error);
      Alert.alert('Error', 'Failed to load scholarship dates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Your UI here */}
    </View>
  );
};
```

### Example 2: Create new scholarship date
```javascript
const handleCreate = async () => {
  try {
    const result = await createScholarshipDate({
      category: 'Senior',
      startDate: '2026-12-01',
      endDate: '2027-01-31',
      remarks: 'Senior Batch 2027',
      isActive: true
    });

    if (result.success) {
      Alert.alert('Success', 'Scholarship date created');
      // Refresh list
      await loadData();
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### Example 3: Delete with confirmation
```javascript
const handleDelete = (id, name) => {
  Alert.alert(
    'Delete',
    `Delete "${name}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteScholarshipDate(id);
            Alert.alert('Success', 'Deleted successfully');
            await loadData();
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
        style: 'destructive'
      }
    ]
  );
};
```

---

## 🔄 API Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "scholarshipDates": [
      {
        "_id": "6a7da5d395951bd94b5628ce",
        "category": "Junior",
        "startDate": "2026-11-20T00:00:00.000Z",
        "endDate": "2026-11-27T00:00:00.000Z",
        "remarks": "Junior Scholarship 2026",
        "isActive": true,
        "createdAt": "2026-08-13T11:08:57.875Z",
        "updatedAt": "2026-11-19T12:22:21.571Z"
      }
    ],
    "totalRecords": 1,
    "totalPages": 1,
    "currentPage": 1
  },
  "message": "Success"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message here"
}
```

---

## 🛡️ Error Handling

All functions automatically:
- ✅ Attach authentication token (from AsyncStorage)
- ✅ Handle 401 Unauthorized errors
- ✅ Log errors to console
- ✅ Throw errors for caller to handle

```javascript
try {
  const data = await getScholarshipDates();
} catch (error) {
  // Handle error
  console.error('Error:', error.message);
}
```

---

## 📝 Notes

- All dates use **YYYY-MM-DD** format
- API automatically adds authentication bearer token
- Pagination: `page` starts at 1, not 0
- Search is optional and case-insensitive
- Status filter uses boolean: `true` = Active, `false` = Inactive

---

## 📍 Integration Points

These functions are already integrated in:
- ✅ `ScholarshipDateMasterScreen.jsx` - List screen
- ✅ `AddScholarshipDateScreen.jsx` - Form screen
- ✅ `RateScholarship` - Rate management screen

You can also use these functions in:
- Dashboard components
- Reports
- Notifications
- Batch operations
- Custom searches

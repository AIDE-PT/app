# Database Schema (Entities & Relationships)

Based on the project structure, screens, and components (such as `associar.tsx`, `dispositivos.tsx`, `healthData.tsx`, `selectConditions.tsx`, etc.), here is the initial database schema. 

As requested, this contains **only the entities and their relationships**. I have only included the `id` and foreign key fields necessary to make the DBML relationship syntax (`Ref`) valid and renderable in tools like [dbdiagram.io](https://dbdiagram.io/). All other data attributes have been omitted.

```dbml
// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table user_types {
  id integer [primary key]
  name varchar
}

Table users {
  id integer [primary key]
  user_type_id integer
}

Table caregivers {
  id integer [primary key]
  user_id integer
}

Table patients {
  id integer [primary key]
  user_id integer
}

Table care_relations {
  id integer [primary key]
  caregiver_id integer
  patient_id integer
}

Table conditions {
  id integer [primary key]
  name varchar
}

Table patient_conditions {
  id integer [primary key]
  patient_id integer
  condition_id integer
}

Table biometric_data_types {
  id integer [primary key]
  name varchar
  description text
  unit varchar
}

Table condition_recommended_biometrics {
  id integer [primary key]
  condition_id integer
  biometric_data_type_id integer
}

Table device_types {
  id integer [primary key]
  name varchar
}

Table devices {
  id integer [primary key]
  device_type_id integer
}

Table device_supported_biometrics {
  id integer [primary key]
  device_id integer
  biometric_data_type_id integer
}

Table patient_devices {
  id integer [primary key]
  patient_id integer
  device_id integer
}

Table biometric_data {
  id integer [primary key]
  patient_id integer
  biometric_data_type_id integer
  device_id integer
  device_type_id integer
}

// --- RELATIONSHIPS ---

Ref: users.user_type_id > user_types.id // many-to-one
Ref: caregivers.user_id - users.id // one-to-one
Ref: patients.user_id - users.id // one-to-one

Ref: care_relations.caregiver_id > caregivers.id // many-to-one
Ref: care_relations.patient_id > patients.id // many-to-one

Ref: patient_conditions.patient_id > patients.id // many-to-one
Ref: patient_conditions.condition_id > conditions.id // many-to-one

Ref: condition_recommended_biometrics.condition_id > conditions.id // many-to-one
Ref: condition_recommended_biometrics.biometric_data_type_id > biometric_data_types.id // many-to-one

Ref: devices.device_type_id > device_types.id // many-to-one

Ref: device_supported_biometrics.device_id > devices.id // many-to-one
Ref: device_supported_biometrics.biometric_data_type_id > biometric_data_types.id // many-to-one

Ref: patient_devices.patient_id > patients.id // many-to-one
Ref: patient_devices.device_id > devices.id // many-to-one

Ref: biometric_data.patient_id > patients.id // many-to-one
Ref: biometric_data.biometric_data_type_id > biometric_data_types.id // many-to-one
Ref: biometric_data.device_id > devices.id // many-to-one
Ref: biometric_data.device_type_id > device_types.id // many-to-one
```

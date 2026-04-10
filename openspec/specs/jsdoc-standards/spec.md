## ADDED Requirements

### Requirement: Spanish JSDoc Pattern

Todos los comentarios JSDoc deben estar en español para consistencia con la documentación existente del proyecto.

#### Scenario: Adding new JSDoc

- **WHEN** agregando JSDoc a un archivo
- **THEN** usar español para todas las descripciones

### Requirement: @param and @returns Tags

Todos los métodos públicos deben incluir tags @param y @returns en su JSDoc.

#### Scenario: Documenting a method

- **WHEN** documentando un método público
- **THEN** incluir @param para cada parámetro y @returns para el valor de retorno

### Requirement: Class Level Documentation

Todas las clases exportadas deben tener una descripción a nivel de clase en JSDoc.

#### Scenario: Documenting a class

- **WHEN** documentando una clase exportada
- **THEN** incluir una descripción a nivel de clase en JSDoc

### Requirement: Auth Module Documentation

Todos los archivos en el directorio src/auth/ deben tener documentación JSDoc.

#### Scenario: Auth module documentation

- **WHEN** documentando archivos de src/auth/
- **THEN** agregar JSDoc de clase y método a auth.service.ts, auth.controller.ts, guards, decorators, strategies

### Requirement: Error Handling Documentation

Todas las clases de error y filtros en src/common/errors/ deben tener documentación JSDoc.

#### Scenario: Error documentation

- **WHEN** documentando clases de error
- **THEN** documentar estructura, uso y herencia del error

### Requirement: Entity and Enum Documentation

Todas las entidades TypeORM y enums deben tener documentación JSDoc.

#### Scenario: Entity documentation

- **WHEN** documentando entidades y enums
- **THEN** agregar descripción de clase y descripción de campos

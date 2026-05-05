# Algoritmos de Sugerencia de Contenido

## ¿Qué son los Sistemas de Recomendación?

Los sistemas de recomendación son algoritmos que predicen qué contenido le puede interesar a un usuario basándose en sus preferencias, comportamiento histórico y características del contenido.

> **Datos clave:** Netflix genera 80% de las visualizaciones a través de recomendaciones, Amazon atribuía 35% de sus ventas a recomendaciones.

---

## Tipos Principales

### 1. Filtrado Colaborativo (Collaborative Filtering)

**Principio:** "Usuarios con gustos similares en el pasado tendrán gustos similares en el futuro."

**Funcionamiento:**

- Se basa en interacciones usuario-contenido (clicks, ratings, compras)
- Encuentra usuarios similares y recomienda lo que a esos les gustó
- No necesita conocer el contenido, solo el comportamiento

**Variantes:**

- **User-Based:** Encontrar usuarios similares y recomendar lo que les gustó
- **Item-Based:** Encontrar items similares a los que el usuario interactuó

**Pseudocódigo:**

```
FUNCIÓN collaborative_filtering(usuario_objetivo, historial_usuarios):
    // 1. Encontrar usuarios similares
    usuarios_similares = []
    PARA CADA usuario EN historial_usuarios:
        SI usuario != usuario_objetivo:
            similitud = calcular_similitud(
                historial_usuario(usuario_objetivo),
                historial_usuario(usuario)
            )
            AGREGAR (usuario, similitud) A usuarios_similares

    // 2. Ordenar por similitud
    ORDENAR usuarios_similares POR similitud DESCENDENTE
    top_similares = PRIMEROS_K(usuarios_similares, k=10)

    // 3. Recomendar items que les gustaron a usuarios similares
    items_recomendables = []
    PARA CADA usuario EN top_similares:
        items_usuario = historial_usuario(usuario)
        PARA CADA item EN items_usuario:
            SI item NO EN historial_usuario(usuario_objetivo):
                AGREGAR item A items_recomendables

    // 4. Retornar items más frecuentemente recomendados
    RETURN TOP_N(items_mas_recomendables, n=10)
```

**Ejemplo real:** Netflix dice "Usuarios que vieron La Casa de Papel también vieron..."

**Pros:**

- No necesita features del contenido
- Descubre conexiones inesperadas
- Mejora con más datos de usuarios

**Contras:**

- Problema cold start (nuevos usuarios/items)
- Necesita muchos datos para funcionar bien

---

### 2. Filtrado Basado en Contenido (Content-Based Filtering)

**Principio:** "Si te gustó X, te gustará Y porque tienen características similares."

**Funcionamiento:**

- Analiza atributos del contenido (género, autor, keywords, etc.)
- Construye perfil del usuario basado en contenido que consumió
- Compara perfil con features de nuevos contenidos

**Pseudocódigo:**

```
FUNCIÓN content_based_filtering(usuario_objetivo, catalogo_items):
    // 1. Construir perfil del usuario desde su historial
    perfil_usuario = construir_perfil(usuario_objetivo)

    // 2. Calcular scores para cada item del catálogo
    scores = []
    PARA CADA item EN catalogo_items:
        features_item = extraer_features(item)
        score = similitud_coseno(perfil_usuario, features_item)
        AGREGAR (item, score) A scores

    // 3. Ordenar y retornar top recommendations
    ORDENAR scores POR score DESCENDENTE
    RETURN PRIMEROS_K(scores, k=10)


FUNCIÓN construir_perfil(usuario):
    historial = obtener_historial(usuario)
    features_acumuladas = []

    PARA CADA item EN historial:
        features = extraer_features(item)
        peso = ponderar_por_interaccion(usuario, item)
        PARA CADA feature EN features:
            AGREGAR (feature, peso) A features_acumuladas

    // Promediar features según ratings/interacciones
    RETURN promediar_features(features_acumuladas)


FUNCIÓN similitud_coseno(vector_a, vector_b):
    producto_punto = producto_punto(vector_a, vector_b)
    magnitud_a = raiz_cuadrada(sumatoria(vector_a^2))
    magnitud_b = raiz_cuadrada(sumatoria(vector_b^2))

    SI magnitud_a == 0 O magnitud_b == 0:
        RETURN 0

    RETURN producto_punto / (magnitud_a * magnitud_b)
```

**Ejemplo real:** Spotify analiza features de audio (tempo, energía, género) para recomendar canciones similares.

**Pros:**

- Funciona para nuevos usuarios (si tienen historial)
- Recomendaciones explicables ("Porque viste películas de ciencia ficción")
- No necesita comunidad de usuarios

**Contras:**

- Riesgo de sobre-especialización (solo recomienda lo mismo)
- Necesita features ricos del contenido

---

### 3. Sistemas Híbridos (Hybrid)

**Principio:** Combinar múltiples enfoques para aprovechar fortalezas de cada uno.

**Estrategias comunes:**

| Estrategia              | Descripción                                        |
| ----------------------- | -------------------------------------------------- |
| **Weighted**            | Combinar scores: `0.6 * score_CF + 0.4 * score_CB` |
| **Switching**           | Usar CF para usuarios activos, CB para nuevos      |
| **Feature Combination** | Unir features de ambos en un modelo                |
| **Cascade**             | Un modelo filtra candidatos, otro ranking final    |

**Pseudocódigo:**

```
FUNCIÓN hybrid_recommendations(usuario, catalogo):
    // Obtener scores de cada enfoque
    score_cf = collaborative_filtering(usuario, catalogo)
    score_cb = content_based_filtering(usuario, catalogo)

    // Combinar con pesos
    scores_finales = []
    PARA CADA item EN catalogo:
        cf = score_cf.obtener(item, 0)
        cb = score_cb.obtener(item, 0)
        score = PESO_CF * cf + PESO_CB * cb
        AGREGAR (item, score) A scores_finales

    ORDENAR scores_finales POR score DESCENDENTE
    RETURN PRIMEROS_K(scores_finales, n=10)
```

**Ejemplo real:** Netflix usa 50+ algoritmos simultáneamente combinando ambos enfoques.

---

## Comparación

| Aspecto          | Colaborativo               | Basado en Contenido    | Híbrido    |
| ---------------- | -------------------------- | ---------------------- | ---------- |
| Datos requeridos | Interacciones usuario-item | Features del contenido | Ambos      |
| Cold start       | Malo                       | Mejor                  | Bueno      |
| Serendipia       | Alta                       | Baja                   | Media-Alta |
| Escalabilidad    | Compleja                   | Más simple             | Variable   |
| Usado por        | Netflix, Amazon            | Spotify, News sites    | Casi todos |

---

## Métricas de Evaluación

```
FUNCIÓN evaluar_recomendaciones(predicciones, ground_truth):
    precision = 0
    recall = 0
    f1 = 0

    // Precision@K: % de recomendaciones relevantes
    relevantes_encontradas = INTERSECCION(predicciones, ground_truth)
    precision = TAMANIO(relevantes_encontradas) / TAMANIO(predicciones)

    // Recall@K: % de items relevantes que recomendaste
    recall = TAMANIO(relevantes_encontradas) / TAMANIO(ground_truth)

    F1 = 2 * (precision * recall) / (precision + recall)

    RETURN { precision, recall, f1 }
```

---

## Cuándo Usar Cada Uno

| Escenario                     | Recomendación           |
| ----------------------------- | ----------------------- |
| Mucho historial de usuarios   | Collaborative Filtering |
| Catálogo con buenos metadatos | Content-Based           |
| Nuevos usuarios frecuentes    | Híbrido o Content-Based |
| Recomendaciones diversas      | Híbrido                 |
| Nicho con metadata rica       | Content-Based           |

---

## Recursos Adicionales

- Netflix Prize (2009): Competencia famosa de recomendación
- Matrix Factorization (SVD): Técnica clásica para sparse matrices
- Deep Learning: Neural Collaborative Filtering, Two-Tower models (YouTube, Spotify)
- Vector Databases: Para búsqueda eficiente de similaridad a escala

---

_Documento generado para Belo Challenge - 2026_

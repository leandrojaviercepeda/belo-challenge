# Algoritmo de Recomendaciones

## Perfil inicial

```
PERFIL_USUARIO: {
  intereses: [],        // ej: [tecnología, cocina]
  categoria_preferida: null,
  historial_compras: []
}

RECOMENDACIONES_PERFIL: {
  "tecnología": ["curso JS", "curso Python"],
  "cocina": ["recetario", "curso sushi"],
  "marketing": ["curso SEO", "curso ads"]
}
```

## Pseudo-código

```
1. ALGORITMO RECOMENDAR(usuario):
   - Obtener perfil del usuario
   - obtener lista = RECOMENDACIONES_PERFIL[perfil.intereses[0]]
   - retornar lista[0:3]  // top 3

2. ALGORITMO AJUSTAR(usuario, feedback):
   - SI feedback == "no me interesa":
     - remover item de recomendaciones
     - agregar nuevo item desde siguiente interés
   - SI feedback == "vi pero no compre":
     - aumentar peso del item
   - SI feedback == "compre":
     - aumentar peso +10
     - analizar historial para inferir nuevo interés
     - AGREGAR_NUEVO_INTERES(usuario, nuevo_item)
   - RETORNAR lista_ajustada
```

## Flujo

```
Usuario entra → Perfil inicial → Recomendación base
      ↓
Feedback usuario → Ajuste dinámico → Nueva recomendación
```

## Ejemplo de ajuste

| Feedback         | Acción                      |
| ---------------- | --------------------------- |
| "no me interesa" | Eliminar, siguiente opción  |
| "compre"         | +10 puntos, inferir interés |
| "click"          | +1 punto                    |

# Predicates



## Symbols

### Value

### Literal

### Col

The Col predicate gets the value of the specified column

#### bind(batch : RecordBatch) : Function

Returns a more efficient accessor for the column values in this batch, taking local indices.

Note: These accessors are typically created in the `DataFrame.scan` bind method, and then used in the the `DataFrame.next` method.

### ComparisonPredicate

### And

### Or

### Equals

### LTEq

### GTEq

### Not

### CustomPredicate

## Source

- [predicate.ts](https://github.com/apache/arrow/blob/maint-0.15.x/js/src/compute/predicate.ts)

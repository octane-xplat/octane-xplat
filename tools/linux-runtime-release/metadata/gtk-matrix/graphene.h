/* Graphene allocates and frees its architecture-aligned matrix storage. */
void *graphene_matrix_alloc(void);
void graphene_matrix_free(void *matrix);
_Bool graphene_matrix_inverse(const void *matrix, void *out_inverse);

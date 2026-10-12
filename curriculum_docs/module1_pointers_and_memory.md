# Module 1: Pointers, Dynamic Memory Allocation, and References

## 1. Core Principles
A pointer is a variable that stores the memory address of another variable. In low-level and systems programming (C/C++), understanding direct memory addressing is essential for building efficient data structures.

- **Address-of Operator (`&`)**: Retrieves the hexadecimal memory location assigned to a variable.
- **Dereference Operator (`*`)**: Accesses or modifies the actual value held at the memory address stored inside a pointer.
- **Null Pointers**: Pointers explicitly assigned `nullptr` or `NULL` to signify they do not point to valid memory addresses, preventing unintentional memory mutations.

## 2. Memory Organization: Stack vs. Heap
- **Stack Memory**: Automatically allocated and deallocated by the compiler for local variables and execution frames. Fast, fixed-size, and follows Last-In-First-Out (LIFO) discipline.
- **Heap Memory**: Dynamically allocated at runtime via system calls (`malloc`, `calloc`, or `new`). Must be manually deallocated using `free()` or `delete`.

## 3. High-Frequency Mistakes and Pitfalls
- **Dangling Pointers**: Occur when dynamic memory is freed, but the pointer variable still holds the deallocated memory address. Accessing it triggers undefined behavior.
- **Memory Leaks**: Occur when dynamic memory is allocated on the heap but never released, consuming system resources over time.
- **Segmentation Faults**: Raised by the OS hardware memory management unit (MMU) when a program attempts to read or write to restricted or unmapped memory regions.

## 4. Diagnostic Review Check
1. Why does accessing `*ptr` when `ptr == NULL` crash a program?
2. Contrast shallow copy versus deep copy when allocating dynamic arrays inside objects.
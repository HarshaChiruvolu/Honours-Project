# Module 3: Asymptotic Analysis, Divide-and-Conquer, and Sorting Algorithms

## 1. Asymptotic Complexity and Big-O Notation
Asymptotic analysis bounds the execution time and spatial growth of algorithms as input size N tends toward infinity.
- **Big-O (O)**: Represents the tight asymptotic upper bound (worst-case execution boundary).
- **Big-Omega (Ω)**: Represents the asymptotic lower bound (best-case best effort).
- **Big-Theta (Θ)**: Represents the asymptotically tight bound, holding when an algorithm's upper and lower bounds coincide.
- **Master Theorem**: Solves recurrence relations of the form `T(n) = a*T(n/b) + f(n)`. Evaluates the critical exponent `log_b(a)` against the polynomial order of `f(n)`.

## 2. Divide-and-Conquer Sorting Paradigms
- **MergeSort**:
  - Recursively splits the array into two halves until single-element subarrays remain.
  - Combines sorted subarrays using a linear two-pointer merge subroutine.
  - Time Complexity: Strictly `Θ(n log n)` in all cases (worst, average, and best).
  - Space Complexity: `O(n)` auxiliary memory required for temporary buffers. Stable sorting guarantee.
- **QuickSort**:
  - Selects a pivot element and partitions the array such that all elements `<= pivot` are positioned to its left, and all elements `> pivot` are to its right (Lomuto or Hoare partitioning).
  - Recursively sorts partitions in-place.
  - Time Complexity: `O(n log n)` average case; degrades to `O(n^2)` worst-case when unbalanced pivots (such as already sorted array with extreme pivot) are chosen.
  - Mitigations: Randomized pivot selection, Median-of-Three pivot strategy.

## 3. High-Frequency Mistakes and Pitfalls
- **Recursion Depth Stack Overflow**: In QuickSort with degenerate partitioning, recursion stack depth reaches `O(n)`. Tail-call elimination and recurring on the smaller partition first guarantees `O(log n)` call stack depth.
- **In-Place Fallacy**: Mergesort is not an in-place sort on arrays due to auxiliary merge buffers, whereas QuickSort operates with `O(log n)` in-place auxiliary stack space.
- **Quadratic Sort Pitfalls**: Using Bubble Sort or Insertion Sort on large datasets (`N > 10,000`) causes severe performance bottlenecks due to `O(n^2)` comparisons.

## 4. Diagnostic Review Check
1. Why does MergeSort require `O(n)` auxiliary memory on contiguous arrays, whereas Linked List MergeSort can achieve `O(1)` extra space?
2. How does the Median-of-Three partitioning strategy prevent the `O(n^2)` worst-case degradation in QuickSort?

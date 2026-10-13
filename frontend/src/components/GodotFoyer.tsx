@@
   const audioCtxRef = useRef<AudioContext | null>(null);
+  // When user explicitly exits pointer lock (Escape) we suppress auto-relocking
+  const suppressAutoLockRef = useRef(false);
@@
-      if (e.code === 'Escape') {
-        if (document.pointerLockElement === containerRef.current) {
-          e.preventDefault();
-          document.exitPointerLock();
-          setIsPointerLocked(false);
-        }
-        return;
-      }
+      if (e.code === 'Escape') {
+        if (document.pointerLockElement === containerRef.current) {
+          e.preventDefault();
+          document.exitPointerLock();
+          setIsPointerLocked(false);
+          // suppress automatic re-locking until the user intentionally clicks the canvas
+          suppressAutoLockRef.current = true;
+        }
+        return;
+      }
@@
-    const onMouseDown = (e: MouseEvent) => {
-      if (isChatFocusedRef.current) return;
-
-      const isInsideGameViewport = !!(e.target instanceof Node && containerRef.current && containerRef.current.contains(e.target));
-      if (!isInsideGameViewport) return;
-
-      // Auto-lock pointer for seamless mouse free aiming
-      if (document.pointerLockElement !== containerRef.current) {
-        const target = e.target as HTMLElement;
-        if (!target?.closest('form') && target?.tagName !== 'INPUT' && target?.tagName !== 'BUTTON') {
-          containerRef.current?.requestPointerLock();
-        }
-      }
+    const onMouseDown = (e: MouseEvent) => {
+      if (isChatFocusedRef.current) return;
+
+      if (!containerRef.current) return;
+      const isInsideGameViewport = e.target instanceof Node && containerRef.current.contains(e.target);
+      if (!isInsideGameViewport) return;
+
+      const target = e.target as HTMLElement;
+      const canvasEl = rendererRef.current?.domElement as HTMLElement | undefined;
+      const isCanvasClick = !!canvasEl && target === canvasEl;
+
+      // If user explicitly exited pointer lock, only re-lock on direct canvas clicks
+      if (suppressAutoLockRef.current && !isCanvasClick) return;
+
+      // Auto-lock pointer for seamless mouse free aiming, but only when clicking the canvas/container directly
+      if (document.pointerLockElement !== containerRef.current) {
+        if (!target?.closest('form') && target?.tagName !== 'INPUT' && target?.tagName !== 'BUTTON') {
+          if (isCanvasClick || target === containerRef.current) {
+            containerRef.current?.requestPointerLock();
+            // If this was an intentional canvas click to re-enter, clear the suppression
+            if (isCanvasClick) suppressAutoLockRef.current = false;
+          }
+        }
+      }
     };
@@
-    containerRef.current.addEventListener('click', (e) => {
-      if (!(e.target instanceof Node) || !containerRef.current || !containerRef.current.contains(e.target)) return;
-      if (isChatFocusedRef.current) return;
-      if ((e.target as HTMLElement)?.closest('form') || (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'BUTTON') return;
-      containerRef.current?.requestPointerLock();
-    });
+    containerRef.current.addEventListener('click', (e) => {
+      if (!containerRef.current) return;
+      const target = e.target as HTMLElement;
+      const canvasEl = rendererRef.current?.domElement as HTMLElement | undefined;
+      // Only allow clicking the actual canvas or the container itself to request pointer lock.
+      const isCanvasClick = !!canvasEl && target === canvasEl;
+      if (!isCanvasClick && target !== containerRef.current) return;
+      if (isChatFocusedRef.current) return;
+      if (target?.closest('form') || target?.tagName === 'INPUT' || target?.tagName === 'BUTTON') return;
+      // Respect suppression state (Escape pressed)
+      if (suppressAutoLockRef.current && !isCanvasClick) return;
+      containerRef.current?.requestPointerLock();
+      if (isCanvasClick) suppressAutoLockRef.current = false;
+    });
@@
     const onPointerLockChange = () => {
-      setIsPointerLocked(document.pointerLockElement === containerRef.current);
+      const locked = document.pointerLockElement === containerRef.current;
+      setIsPointerLocked(locked);
+      // If pointer lock was released externally (e.g. user pressed Escape), suppress auto-lock until explicit canvas click
+      if (!locked) suppressAutoLockRef.current = true;
     };

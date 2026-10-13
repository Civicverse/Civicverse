@@
     const onKeyDown = (e: KeyboardEvent) => {
+      if (e.code === 'Escape') {
+        if (document.pointerLockElement === containerRef.current) {
+          e.preventDefault();
+          document.exitPointerLock();
+          setIsPointerLocked(false);
+        }
+        return;
+      }
+
       // If typing in chat, do not trigger game controls
       if (isChatFocusedRef.current) {
         if (e.code === 'Escape') {
           chatInputRef.current?.blur();
         }
@@
     const onMouseDown = (e: MouseEvent) => {
       if (isChatFocusedRef.current) return;
+
+      const isInsideGameViewport = !!(e.target instanceof Node && containerRef.current && containerRef.current.contains(e.target));
+      if (!isInsideGameViewport) return;
 
       // Auto-lock pointer for seamless mouse free aiming
       if (document.pointerLockElement !== containerRef.current) {
         const target = e.target as HTMLElement;
         if (!target?.closest('form') && target?.tagName !== 'INPUT' && target?.tagName !== 'BUTTON') {
@@
     const onContextMenu = (e: MouseEvent) => {
       // Prevent browser context menu so right click walks smoothly
       e.preventDefault();
     };
@@
     containerRef.current.addEventListener('click', (e) => {
+      if (!(e.target instanceof Node) || !containerRef.current || !containerRef.current.contains(e.target)) return;
       if (isChatFocusedRef.current) return;
       if ((e.target as HTMLElement)?.closest('form') || (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'BUTTON') return;
       containerRef.current?.requestPointerLock();
     });
**
     const onPointerLockChange = () => {
       setIsPointerLocked(document.pointerLockElement === containerRef.current);
     };

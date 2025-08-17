import React, { useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface WhiteboardProps {
  roomId: string;
  isEnabled?: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ roomId, isEnabled = true }) => {
  const [elements, setElements] = useState([]);
  const ydoc = useRef<Y.Doc>();
  const provider = useRef<WebsocketProvider>();
  const yarray = useRef<Y.Array<any>>();

  useEffect(() => {
    if (!isEnabled) return;

    console.log('🎨 [Whiteboard] Initializing collaborative whiteboard for room:', roomId);
    
    try {
      ydoc.current = new Y.Doc();
      const wsUrl = import.meta.env.VITE_YWS_URL || 'ws://localhost:1234';
      provider.current = new WebsocketProvider(wsUrl, `wb-${roomId}`, ydoc.current);
      yarray.current = ydoc.current.getArray('excalidraw');

      // Sync -> whenever yarray changes, update elements
      yarray.current.observe(() => {
        const newElements = yarray.current?.toArray() || [];
        console.log('🎨 [Whiteboard] Elements updated from collaboration:', newElements.length);
        setElements(newElements);
      });

      console.log('✅ [Whiteboard] Collaborative whiteboard initialized');
    } catch (error) {
      console.error('❌ [Whiteboard] Failed to initialize:', error);
    }

    return () => {
      console.log('🧹 [Whiteboard] Cleaning up whiteboard...');
      provider.current?.destroy();
      ydoc.current?.destroy();
    };
  }, [roomId, isEnabled]);

  const handleChange = (newElements: any[]) => {
    if (!yarray.current || !isEnabled) return;
    
    try {
      console.log('🎨 [Whiteboard] Broadcasting changes:', newElements.length, 'elements');
      yarray.current.doc?.transact(() => {
        yarray.current!.delete(0, yarray.current!.length);
        yarray.current!.insert(0, newElements);
      });
    } catch (error) {
      console.error('❌ [Whiteboard] Failed to broadcast changes:', error);
    }
  };

  if (!isEnabled) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎨</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Whiteboard not available</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '70vh' }} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <Excalidraw
        initialData={{ elements }}
        onChange={handleChange}
        viewModeEnabled={false}
        zenModeEnabled={false}
        gridModeEnabled={true}
        theme="light"
      />
    </div>
  );
};

export default Whiteboard;
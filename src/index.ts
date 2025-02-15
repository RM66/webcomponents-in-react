import React, { useEffect, useRef } from "react";
import {
  filterOutRichData,
  isRichData,
  mapKeyToPropertyName,
  mapKeyToEventName,
  shouldKeyBeMapped
} from "./helper";
import { OverrideProps, EventListenerMap } from "./interfaces";
import { DEFAULT_EVENT_PREFIX } from "./constants";

export const adapt = <T = any>(
  componentSelector: string,
  overrideProps?: OverrideProps
) => {
  return (props: T & EventListenerMap) => {
    const webComponentRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      const eventListeners: EventListenerMap = {};

      const removeEventListeners = () => {
        for (let key in eventListeners) {
          const handler = eventListeners[key];
          webComponentRef.current!.removeEventListener(
            mapKeyToEventName(key, overrideProps),
            handler
          );
        }
      };

      const setUpEventListeners = () => {
        for (let key in props) {
          const handler = props[key];

          if (
            key.indexOf(DEFAULT_EVENT_PREFIX) === -1 &&
            !shouldKeyBeMapped(key, overrideProps)
          ) {
            continue;
          }

          if (typeof handler !== `function`) {
            continue;
          }

          eventListeners[key] = handler;
          webComponentRef.current!.addEventListener(
            mapKeyToEventName(key, overrideProps),
            handler
          );
        }
      };

      const updatePropertiesForRichData = () => {
        for (let key in props) {
          const data = props[key];
          if (!isRichData(data) || key === "children") {
            continue;
          }
          webComponentRef.current![
            mapKeyToPropertyName(key, overrideProps)
          ] = data;
        }
      };

      setUpEventListeners();
      updatePropertiesForRichData();

      return () => {
        removeEventListeners();
      };
    });

    return React.createElement(componentSelector, {
      ref: (ref: HTMLElement) => (webComponentRef.current = ref),
      ...filterOutRichData(props, overrideProps)
    });
  };
};

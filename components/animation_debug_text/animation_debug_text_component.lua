local AnimationDebugTextComponent = class()
local rng = _radiant.math.get_default_rng()

function AnimationDebugTextComponent:initialize()
   self._sv.current_animation = ''
end

function AnimationDebugTextComponent:activate()
   self._animation_start_listener = radiant.events.listen(self._entity, 'stonehearth:effects:animation_effect', self, self._on_animation_start)
end

function AnimationDebugTextComponent:destroy()
   if self._animation_start_listener then
      self._animation_start_listener:destroy()
      self._animation_start_listener = nil
   end
end

function AnimationDebugTextComponent:_on_animation_start(args)
   self._sv.current_animation = args.effect_name
   self.__saved_variables:mark_changed()
end

return AnimationDebugTextComponent

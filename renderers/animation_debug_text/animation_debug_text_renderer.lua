local Point3 = _radiant.csg.Point3

local AnimationRenderer = class()

function AnimationRenderer:initialize(render_entity, datastore)
   self._entity = render_entity:get_entity()
   self._render_entity = render_entity
   self._entity_node = render_entity:get_node()

   self._datastore = datastore

   self._datastore_trace = self._datastore:trace('updating animation')
                        :on_changed(function()
                              self:_update_animation()
                           end)
end

function AnimationRenderer:destroy()
   if self._text_node then
      self._text_node:destroy()
      self._text_node = nil
   end
   if self._datastore_trace then
      self._datastore_trace:destroy()
      self._datastore_trace = nil
   end
end

function AnimationRenderer:_update_animation()
   local animation = self._datastore:get_data().current_animation
   if animation == self._current_animation then
      return
   end

   self._current_animation = animation

   if self._text_node then
      self._text_node:destroy()
   end

   if self._current_animation and self._current_animation ~= '' then
      local over_cog_node = self._render_entity:get_skeleton():get_bone_node('ATTOVERCOG')
      self._text_node = _radiant.client.create_text_node(over_cog_node, self._current_animation)
   end
end

return AnimationRenderer

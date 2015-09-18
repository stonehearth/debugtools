local Point3 = _radiant.csg.Point3
local EntityEditorCommands = class()

function EntityEditorCommands:update_entity_command(session, response, entity, options)
   if not entity then
      return false
   end
   
   if options.mob then
      local mob_component = entity:get_component('mob')
      if options.mob.axis_alignment_flags then
         mob_component:set_align_to_grid_flags(options.mob.axis_alignment_flags)
      end
      if options.mob.model_origin_updates then
         local new_model_origin = Point3(options.mob.model_origin_updates.x, options.mob.model_origin_updates.y, options.mob.model_origin_updates.z)
         mob_component:set_model_origin(new_model_origin)
      end
      if options.mob.region_origin_updates then
         local new_region_origin = Point3(options.mob.region_origin_updates.x, options.mob.region_origin_updates.y, options.mob.region_origin_updates.z)
         mob_component:set_region_origin(new_region_origin)
      end
      mob_component:move_to(mob_component:get_world_grid_location())
   end

   return true
end

return EntityEditorCommands
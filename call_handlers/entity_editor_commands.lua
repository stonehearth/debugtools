local Point3 = _radiant.csg.Point3
local Region3 = _radiant.csg.Region3
local Cube3 = _radiant.csg.Cube3
local EntityEditorCommands = class()

function EntityEditorCommands:update_entity_command(session, response, entity, options)
   if not entity then
      return false
   end
   local mob_component = entity:get_component('mob')
   if options.mob then
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
      
   end
   
   if options.destination then
      local destination_component = entity:get_component('destination')
      if options.destination.region_updates then
         local regions = options.destination.region_updates
         local new_region = _radiant.sim.alloc_region3()
         new_region:modify(function(cursor)
            for _, region in ipairs(regions) do
               cursor:add_cube(Cube3(Point3(region.min.x, region.min.y, region.min.z), Point3(region.max.x, region.max.y, region.max.z)))
            end
         end)
         destination_component:set_region(new_region)
      end
      if options.destination.adjacency_flags then
         destination_component:set_adjacency_flags(options.destination.adjacency_flags)
      end
   end
   
   if options.region_collision_shape then
      local region_collision_shape_component = entity:get_component('region_collision_shape')
      if options.region_collision_shape.region_updates then
         local regions = options.region_collision_shape.region_updates
         local new_region = _radiant.sim.alloc_region3()
         new_region:modify(function(cursor)
            for _, region in ipairs(regions) do
               cursor:add_cube(Cube3(Point3(region.min.x, region.min.y, region.min.z), Point3(region.max.x, region.max.y, region.max.z)))
            end
         end)
      
         region_collision_shape_component:set_region(new_region)
      end
   end
   
   mob_component:move_to(mob_component:get_world_grid_location())

   return true
end

return EntityEditorCommands
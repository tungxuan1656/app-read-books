import { Screen } from '@/components/Screen'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { VectorIcon } from '@/components/Icon'
import { AppPalette } from '../../assets'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { getBookChapterContent, getChapterHtml, showToastError } from '../../utils'
import { setReadingContext, useReading } from '../../controllers/context'
import SheetBookInfo from '@/components/SheetBookInfo'

const test1 = `<div><h2> Chương 1: Ta thành phú nhị đại phản phái </h2><div> Chương 1: Ta thành phú nhị đại phản phái<br><br>Cửa trường học, một cỗ Rolls-Royce Cullinan dừng lại, tài xế cung kính kéo xuống cửa xe.<br><br>Ngay sau đó, trong xe đi ra một thiếu niên.<br><br>Thiếu niên nhìn qua mười tám tuổi bộ dạng, thân hình thẳng tắp, dung mạo tuấn lãng.<br><br>Xung quanh không ít chạy đến đi học nữ sinh nhìn thấy, cơ hồ từng cái tâm hoa nộ phóng, nhịn không được muốn dựa sát.<br><br>Chỉ là cái này sắc mặt của thiếu niên âm trầm, cho người ta một loại người lạ đừng vào cảm giác.<br><br>Thiếu niên gọi Vương Hạo Nhiên.<br><br>Hắn hiện tại, tâm tình phi thường kém.<br><br>Cuối cùng loại chuyện này phát sinh tại bất cứ người nào trên mình, bất kể là ai tâm tình cũng sẽ không tốt.<br><br>Hắn là cái Xuyên Việt giả.<br><br>Xuyên qua phía trước, hắn là cô nhi, tại trong đại thành thị giãy dụa, tuổi gần ba mươi, vẫn như cũ tầm thường vô vi, liền một người nữ sinh đều đuổi không kịp, là cái từ đầu đến đuôi kẻ thất bại.<br><br>Trong đời hỏng bét trải qua, cơ hồ ở trên người hắn đều phát sinh.<br><br>Sau khi xuyên việt, hắn là một cái phú nhị đại.<br><br>Gia thế tốt, dáng dấp đẹp trai, học tập bổng.<br><br>Mỗi ngày trên dưới học, đều có Cullinan đưa đón.<br><br>Tiền tiêu vặt nhiều phải dùng không hết.<br><br>Lúc đầu gặp được chuyện như vậy, nằm mơ đều sẽ cười tỉnh.<br><br>Trên thực tế, mới sau khi xuyên việt mấy ngày, thật sự là hắn cảm thấy thật thoải mái, nằm mơ đều cười.<br><br>Cuối cùng hắn kiếp trước sinh hoạt đến hỏng bét như vậy.<br><br>Tại sau khi xuyên việt có dạng này ưu dị sinh hoạt điều kiện.<br><br>Đổi ai cũng sẽ cảm thấy thoải mái.<br><br>Nhưng hắn rất nhanh liền phát hiện, sự tình không đơn giản như vậy.<br><br>Trong lớp ở cuối xe học sinh kém, gần đây thành tích học tập đột nhiên tăng mạnh, đồng thời còn thân là giáo hoa ủy viên học tập chợt có động nhau.<br><br>Phải biết, tại mọi người trong mắt, Vương Hạo Nhiên cùng giáo hoa mới là một đôi trời sinh.<br><br>Tuy là điểm này giáo hoa cũng không thừa nhận.<br><br>Ở cuối xe học sinh kém cùng giáo hoa đi đến gần, những cái kia tay sai tiểu đệ liền không nhịn được lấy lòng.<br><br><div id="middle-content-one"></div><br><br>Không phải sao, hôm qua đem ở cuối xe học sinh kém gọi tới trong góc, muốn đối với hắn tiến hành một phen khắc sâu giáo dục.<br><br>Ba người đánh một cái, thế nào nhìn đều là nghiền ép.<br><br>Nhưng kết quả lại là ba tiểu đệ bị bạo đánh xong!<br><br>Kiếp trước đọc nhiều văn học mạng Vương Hạo Nhiên, thế nào đều cảm giác nội dung truyện giống như đã từng quen biết.<br><br>Cái này chẳng phải là ở cuối xe trở mình cua giáo hoa tiểu thuyết đô thị nội dung truyện sao?<br><br>Mà thân thế của mình bối cảnh cùng điều kiện cái gì, trọn vẹn liền một cái phản phái phú nhị đại mô bản.<br><br>Toát ra ý nghĩ này phía sau, Vương Hạo Nhiên lại nhịn cười không được, cảm thấy khả năng là mình cả nghĩ quá rồi.<br><br>Nhưng vào lúc này, Xuyên Việt giả tiêu phối hệ thống đi ra.<br><br>Hệ thống danh tự, gọi là siêu cấp đại phản phái hệ thống.<br><br>Thông qua hệ thống, hắn biết được, chính mình xuyên qua đến một cái đô thị sảng văn tiểu thuyết tạo dựng thế giới song song bên trong.<br><br>Thân phận của hắn không thể nghi ngờ, chính là một mai thật tốt phản phái phú nhị đại, là bị nhân vật chính đánh mặt công cụ người.<br><br>Nội dung chính tuyến bên trong, hắn không ngừng cùng nhân vật chính chống lại, lại từng bước một thất bại, đại khái sống không đến 100 chương thời gian, bị nhân vật chính làm đến cửa nát nhà tan.<br><br>Gia sản bị nhân vật chính chiếm, ưa thích giáo hoa cũng là nhân vật chính.<br><br>"Móa, xuyên qua thành cái gì không được, nhất định để ta xuyên qua thành phản phái, liền 100 chương đều không sống tới, chơi ta đây? !"<br><br>Vương Hạo Nhiên ở trong lòng chửi bậy phát tiết.<br><br>Bất quá đã là cố định sự thật, hắn cũng biết vô lực đi thay đổi.<br><br>Tất nhiên, cái này cũng không đại biểu lấy hắn đến đây chấp nhận.<br><br>Theo mấy ngày gần đây sự kiện tới nhìn, tiểu thuyết nội dung truyện rõ ràng vừa mới bắt đầu.<br><br>Nhân vật chính vừa mới bắt đầu trưởng thành, vẫn không thể cùng mình cương chính diện.<br><br>Chính mình có tài nguyên, muốn so nhân vật chính nhiều quá nhiều.<br><br>Chỉ cần lợi dụng được những cái này, tăng thêm chính mình có đề phòng, chính mình cái này phản phái cũng không phải trọn vẹn không có cách nào nghịch tập.<br><br>"Lão đại."<br><br>Trong lúc suy tư, một cái đội mũ nam sinh từ phía sau đi tới.<br><br>Dưới mũ, lờ mờ có thể thấy được trên mặt hắn có chút bầm tím.<br><br>Hiển nhiên là b·ị đ·ánh.<br><br><div id="middle-content-two"></div><br><br>Đây là bên cạnh Vương Hạo Nhiên tam đại tiểu đệ một trong, gọi Phạm Kiếm.<br><br>Mặt khác hai cái, một cái gọi Phạm Thông, một cái gọi Tần Thọ Sinh.<br><br>Nghe một chút, đều nghe một chút!<br><br>Đây đều là chút gì danh tự.<br><br>Phạm Kiếm, phạm tiện?<br><br>Phạm Thông, thùng cơm?<br><br>Tần Thọ Sinh, cầm thú sinh?<br><br>Ba người này hiển nhiên liền là phản phái một hệ.<br><br>Hiển nhiên, đây là ác thú vị sa điêu tác giả tận lực thiết kế.<br><br>Phạm Kiếm thần tình lúng túng, sợ tiếp xúc Vương Hạo Nhiên quan sát ánh mắt.<br><br>Hoàn toàn chính xác, đây là mất mặt a.<br><br>Ba cái đánh một không đánh qua.<br><br>Phạm Kiếm bị nhìn chằm chằm một hồi, rốt cục có chút nhịn không được, chủ động thừa nhận sai lầm.<br><br>"Lão đại, ngươi muốn đánh phải không, tùy theo ngươi, là chúng ta cho ngươi mất thể diện."<br><br>"Làm sao lại ngươi một người, mặt khác hai cái đây?" Vương Hạo Nhiên không có trách cứ, chỉ là hỏi.<br><br>Bởi vì hắn biết trách cứ vô dụng, người ta có nhân vật chính quang hoàn hộ thân, nào có dễ dàng như vậy bị ba người các ngươi xú cá nát tôm đánh một hồi.<br><br>Phạm Kiếm gặp Vương Hạo Nhiên không có trách cứ, nhẹ nhàng thở ra, hấp tấp đến gần một chút, cười toe toét nói:<br><br>"Hồi lão đại, ta chạy nhanh một điểm, ít chịu không ít đánh, bọn hắn liền hơi yếu một chút, chạy đến chậm b·ị đ·ánh thảm, nửa bên mặt đều nhanh sưng biến loại hình, phỏng chừng rất nhiều ngày mới biến mất đây!"<br><br>Vương Hạo Nhiên nhìn thấy đối phương sắc mặt này thần tình, không kềm nổi không còn gì để nói.<br><br>Cái này sa điêu tác giả cho chính mình phối cái gì bại não tiểu đệ.<br><br>Chạy nhanh ít chịu đánh, rõ ràng còn đắc ý dào dạt muốn khoe khoang đồng dạng.<br><br>Thế nào, còn muốn lão tử khen ngươi hay sao? !<br><br>"Ngươi nếu là lại tiếp tục cười một thoáng, ta liền muốn một bàn tay bên trên mặt ngươi."<br><br>Vương Hạo Nhiên thực tế chịu không được cái này bại não tiểu đệ cười ngây ngô, khiển trách một tiếng.<br><br>"Lão đại, đừng đừng, ta sai rồi ta sai rồi, không cười." Phạm Kiếm tranh thủ thời gian thừa nhận sai lầm, cũng nói:<br><br><div id="middle-content-three"></div><br><br>"Lão đại ngươi yên tâm, tràng tử này ta nhất định tìm trở về, ta còn cũng không tin, tiểu tử kia có ba đầu sáu tay, hôm nay ta gọi mười cái huynh đệ đi!"<br><br>"Tỉnh lại đi, vô dụng." Vương Hạo Nhiên lắc đầu.<br><br>Hiện tại đã đả thảo kinh xà, nhân vật chính có đề phòng, tăng thêm nhân vật chính quang hoàn tác dụng, tiếp tục gọi người đi qua, cũng chỉ là cho nhân vật chính đưa bao cát mà thôi.<br><br>Lùi một bước nói, cho dù nhân vật chính đánh không được, cũng khẳng định là thoải mái đào thoát.<br><br>Cái này căn bản là vô nghĩa.<br><br>"Vô dụng? Cái kia lão đại, ta gọi hai mươi cái?"<br><br>"Nói nhảm thế nào nhiều như vậy, nói vô dụng."<br><br>"Làm sao có khả năng, vậy ta gọi ba mươi tốt."<br><br>"Ngươi cứ gọi ngươi sao được rồi!" Vương Hạo Nhiên nhịn không được xổ một câu nói tục.<br><br>"Gọi ta mẹ? Lão đại, cái này không. . . Không được a. Mẹ ta cái kia yếu thể cốt, sao có thể đánh a." Phạm Kiếm vẻ mặt đau khổ nói.<br><br>Vương Hạo Nhiên vuốt vuốt huyệt thái dương, đây là cái gì bại não tiểu đệ a.<br><br>Cố nén đánh người xúc động, cũng trở lại yên tĩnh một thoáng tâm tình phía sau.<br><br>"Loại chuyện này sau đó không cần làm."<br><br>"A, lão đại, tiểu tử kia cua đại tẩu đây, hắn là cái thá gì a, chúng ta thực tế nhìn không được a." Phạm Kiếm nói.<br><br>"Ta hỏi ngươi, ta soái vẫn là tiểu tử kia soái?" Vương Hạo Nhiên đối tiểu đệ hỏi vặn lại.<br><br>"Đương nhiên là lão đại ngươi soái, tiểu tử kia tính toán cái gì, nhiều lắm thì ngũ quan nghiêm chỉnh."<br><br>Phạm Kiếm không có chút nào do dự trả lời, ở trong đó trọn vẹn không có vuốt mông ngựa ý tứ, bởi vì đây là sự thật.<br><br>"Đó là nhà ta thế tốt, vẫn là nhà của tiểu tử kia thế tốt?" Vương Hạo Nhiên tiếp tục hỏi.<br><br>"Lão đại nhà ngươi mấy trăm ức tài sản đây, nhà của tiểu tử kia cảnh phổ thông, cái này trọn vẹn không khả năng so sánh."<br><br>"Đó là ta thành tích tốt, vẫn là tiểu tử kia thành tích tốt đây?"<br><br>"Lão đại ngươi thành tích toàn trường trước mười, thật tốt học bá, tiểu tử kia đếm ngược, liền một học tra."<br><br>"Vậy liền hết à? Ta như vậy điều kiện tốt, chẳng lẽ còn sẽ thua bởi ở cuối xe tiểu tử nghèo? Muốn các ngươi quản nhiều cái gì nhàn sự?"<br><br>"Lão đại, ta hiểu được minh bạch, là chúng ta uổng công vô ích, không có ngươi phân phó, chúng ta sẽ không nhiều chuyện.<br><br>Tiểu tử kia căn bản không xứng cùng ngươi so." Phạm Kiếm cuối cùng là hiểu rõ.<br><br>Vương Hạo Nhiên gật đầu một cái, dùng ngu khiến cho ánh mắt nhìn một chút cái này bại não tiểu đệ.<br><br>Bỗng nhiên, trong đầu xuất hiện một đạo hệ thống nhắc nhở tin tức.<br><br>【 đinh, dẫn dắt tiểu đệ hành động, thoáng thay đổi nội dung truyện hướng đi, thu được điểm phản phái 100. 】 </div></div>`
const test2 = `<div><h2> Chương 2: Ta thành phú nhị đại phản phái </h2><div> Chương 1: Ta thành phú nhị đại phản phái<br><br>Cửa trường học, một cỗ Rolls-Royce Cullinan dừng lại, tài xế cung kính kéo xuống cửa xe.<br><br>Ngay sau đó, trong xe đi ra một thiếu niên.<br><br>Thiếu niên nhìn qua mười tám tuổi bộ dạng, thân hình thẳng tắp, dung mạo tuấn lãng.<br><br>Xung quanh không ít chạy đến đi học nữ sinh nhìn thấy, cơ hồ từng cái tâm hoa nộ phóng, nhịn không được muốn dựa sát.<br><br>Chỉ là cái này sắc mặt của thiếu niên âm trầm, cho người ta một loại người lạ đừng vào cảm giác.<br><br>Thiếu niên gọi Vương Hạo Nhiên.<br><br>Hắn hiện tại, tâm tình phi thường kém.<br><br>Cuối cùng loại chuyện này phát sinh tại bất cứ người nào trên mình, bất kể là ai tâm tình cũng sẽ không tốt.<br><br>Hắn là cái Xuyên Việt giả.<br><br>Xuyên qua phía trước, hắn là cô nhi, tại trong đại thành thị giãy dụa, tuổi gần ba mươi, vẫn như cũ tầm thường vô vi, liền một người nữ sinh đều đuổi không kịp, là cái từ đầu đến đuôi kẻ thất bại.<br><br>Trong đời hỏng bét trải qua, cơ hồ ở trên người hắn đều phát sinh.<br><br>Sau khi xuyên việt, hắn là một cái phú nhị đại.<br><br>Gia thế tốt, dáng dấp đẹp trai, học tập bổng.<br><br>Mỗi ngày trên dưới học, đều có Cullinan đưa đón.<br><br>Tiền tiêu vặt nhiều phải dùng không hết.<br><br>Lúc đầu gặp được chuyện như vậy, nằm mơ đều sẽ cười tỉnh.<br><br>Trên thực tế, mới sau khi xuyên việt mấy ngày, thật sự là hắn cảm thấy thật thoải mái, nằm mơ đều cười.<br><br>Cuối cùng hắn kiếp trước sinh hoạt đến hỏng bét như vậy.<br><br>Tại sau khi xuyên việt có dạng này ưu dị sinh hoạt điều kiện.<br><br>Đổi ai cũng sẽ cảm thấy thoải mái.<br><br>Nhưng hắn rất nhanh liền phát hiện, sự tình không đơn giản như vậy.<br><br>Trong lớp ở cuối xe học sinh kém, gần đây thành tích học tập đột nhiên tăng mạnh, đồng thời còn thân là giáo hoa ủy viên học tập chợt có động nhau.<br><br>Phải biết, tại mọi người trong mắt, Vương Hạo Nhiên cùng giáo hoa mới là một đôi trời sinh.<br><br>Tuy là điểm này giáo hoa cũng không thừa nhận.<br><br>Ở cuối xe học sinh kém cùng giáo hoa đi đến gần, những cái kia tay sai tiểu đệ liền không nhịn được lấy lòng.<br><br><div id="middle-content-one"></div><br><br>Không phải sao, hôm qua đem ở cuối xe học sinh kém gọi tới trong góc, muốn đối với hắn tiến hành một phen khắc sâu giáo dục.<br><br>Ba người đánh một cái, thế nào nhìn đều là nghiền ép.<br><br>Nhưng kết quả lại là ba tiểu đệ bị bạo đánh xong!<br><br>Kiếp trước đọc nhiều văn học mạng Vương Hạo Nhiên, thế nào đều cảm giác nội dung truyện giống như đã từng quen biết.<br><br>Cái này chẳng phải là ở cuối xe trở mình cua giáo hoa tiểu thuyết đô thị nội dung truyện sao?<br><br>Mà thân thế của mình bối cảnh cùng điều kiện cái gì, trọn vẹn liền một cái phản phái phú nhị đại mô bản.<br><br>Toát ra ý nghĩ này phía sau, Vương Hạo Nhiên lại nhịn cười không được, cảm thấy khả năng là mình cả nghĩ quá rồi.<br><br>Nhưng vào lúc này, Xuyên Việt giả tiêu phối hệ thống đi ra.<br><br>Hệ thống danh tự, gọi là siêu cấp đại phản phái hệ thống.<br><br>Thông qua hệ thống, hắn biết được, chính mình xuyên qua đến một cái đô thị sảng văn tiểu thuyết tạo dựng thế giới song song bên trong.<br><br>Thân phận của hắn không thể nghi ngờ, chính là một mai thật tốt phản phái phú nhị đại, là bị nhân vật chính đánh mặt công cụ người.<br><br>Nội dung chính tuyến bên trong, hắn không ngừng cùng nhân vật chính chống lại, lại từng bước một thất bại, đại khái sống không đến 100 chương thời gian, bị nhân vật chính làm đến cửa nát nhà tan.<br><br>Gia sản bị nhân vật chính chiếm, ưa thích giáo hoa cũng là nhân vật chính.<br><br>"Móa, xuyên qua thành cái gì không được, nhất định để ta xuyên qua thành phản phái, liền 100 chương đều không sống tới, chơi ta đây? !"<br><br>Vương Hạo Nhiên ở trong lòng chửi bậy phát tiết.<br><br>Bất quá đã là cố định sự thật, hắn cũng biết vô lực đi thay đổi.<br><br>Tất nhiên, cái này cũng không đại biểu lấy hắn đến đây chấp nhận.<br><br>Theo mấy ngày gần đây sự kiện tới nhìn, tiểu thuyết nội dung truyện rõ ràng vừa mới bắt đầu.<br><br>Nhân vật chính vừa mới bắt đầu trưởng thành, vẫn không thể cùng mình cương chính diện.<br><br>Chính mình có tài nguyên, muốn so nhân vật chính nhiều quá nhiều.<br><br>Chỉ cần lợi dụng được những cái này, tăng thêm chính mình có đề phòng, chính mình cái này phản phái cũng không phải trọn vẹn không có cách nào nghịch tập.<br><br>"Lão đại."<br><br>Trong lúc suy tư, một cái đội mũ nam sinh từ phía sau đi tới.<br><br>Dưới mũ, lờ mờ có thể thấy được trên mặt hắn có chút bầm tím.<br><br>Hiển nhiên là b·ị đ·ánh.<br><br><div id="middle-content-two"></div><br><br>Đây là bên cạnh Vương Hạo Nhiên tam đại tiểu đệ một trong, gọi Phạm Kiếm.<br><br>Mặt khác hai cái, một cái gọi Phạm Thông, một cái gọi Tần Thọ Sinh.<br><br>Nghe một chút, đều nghe một chút!<br><br>Đây đều là chút gì danh tự.<br><br>Phạm Kiếm, phạm tiện?<br><br>Phạm Thông, thùng cơm?<br><br>Tần Thọ Sinh, cầm thú sinh?<br><br>Ba người này hiển nhiên liền là phản phái một hệ.<br><br>Hiển nhiên, đây là ác thú vị sa điêu tác giả tận lực thiết kế.<br><br>Phạm Kiếm thần tình lúng túng, sợ tiếp xúc Vương Hạo Nhiên quan sát ánh mắt.<br><br>Hoàn toàn chính xác, đây là mất mặt a.<br><br>Ba cái đánh một không đánh qua.<br><br>Phạm Kiếm bị nhìn chằm chằm một hồi, rốt cục có chút nhịn không được, chủ động thừa nhận sai lầm.<br><br>"Lão đại, ngươi muốn đánh phải không, tùy theo ngươi, là chúng ta cho ngươi mất thể diện."<br><br>"Làm sao lại ngươi một người, mặt khác hai cái đây?" Vương Hạo Nhiên không có trách cứ, chỉ là hỏi.<br><br>Bởi vì hắn biết trách cứ vô dụng, người ta có nhân vật chính quang hoàn hộ thân, nào có dễ dàng như vậy bị ba người các ngươi xú cá nát tôm đánh một hồi.<br><br>Phạm Kiếm gặp Vương Hạo Nhiên không có trách cứ, nhẹ nhàng thở ra, hấp tấp đến gần một chút, cười toe toét nói:<br><br>"Hồi lão đại, ta chạy nhanh một điểm, ít chịu không ít đánh, bọn hắn liền hơi yếu một chút, chạy đến chậm b·ị đ·ánh thảm, nửa bên mặt đều nhanh sưng biến loại hình, phỏng chừng rất nhiều ngày mới biến mất đây!"<br><br>Vương Hạo Nhiên nhìn thấy đối phương sắc mặt này thần tình, không kềm nổi không còn gì để nói.<br><br>Cái này sa điêu tác giả cho chính mình phối cái gì bại não tiểu đệ.<br><br>Chạy nhanh ít chịu đánh, rõ ràng còn đắc ý dào dạt muốn khoe khoang đồng dạng.<br><br>Thế nào, còn muốn lão tử khen ngươi hay sao? !<br><br>"Ngươi nếu là lại tiếp tục cười một thoáng, ta liền muốn một bàn tay bên trên mặt ngươi."<br><br>Vương Hạo Nhiên thực tế chịu không được cái này bại não tiểu đệ cười ngây ngô, khiển trách một tiếng.<br><br>"Lão đại, đừng đừng, ta sai rồi ta sai rồi, không cười." Phạm Kiếm tranh thủ thời gian thừa nhận sai lầm, cũng nói:<br><br><div id="middle-content-three"></div><br><br>"Lão đại ngươi yên tâm, tràng tử này ta nhất định tìm trở về, ta còn cũng không tin, tiểu tử kia có ba đầu sáu tay, hôm nay ta gọi mười cái huynh đệ đi!"<br><br>"Tỉnh lại đi, vô dụng." Vương Hạo Nhiên lắc đầu.<br><br>Hiện tại đã đả thảo kinh xà, nhân vật chính có đề phòng, tăng thêm nhân vật chính quang hoàn tác dụng, tiếp tục gọi người đi qua, cũng chỉ là cho nhân vật chính đưa bao cát mà thôi.<br><br>Lùi một bước nói, cho dù nhân vật chính đánh không được, cũng khẳng định là thoải mái đào thoát.<br><br>Cái này căn bản là vô nghĩa.<br><br>"Vô dụng? Cái kia lão đại, ta gọi hai mươi cái?"<br><br>"Nói nhảm thế nào nhiều như vậy, nói vô dụng."<br><br>"Làm sao có khả năng, vậy ta gọi ba mươi tốt."<br><br>"Ngươi cứ gọi ngươi sao được rồi!" Vương Hạo Nhiên nhịn không được xổ một câu nói tục.<br><br>"Gọi ta mẹ? Lão đại, cái này không. . . Không được a. Mẹ ta cái kia yếu thể cốt, sao có thể đánh a." Phạm Kiếm vẻ mặt đau khổ nói.<br><br>Vương Hạo Nhiên vuốt vuốt huyệt thái dương, đây là cái gì bại não tiểu đệ a.<br><br>Cố nén đánh người xúc động, cũng trở lại yên tĩnh một thoáng tâm tình phía sau.<br><br>"Loại chuyện này sau đó không cần làm."<br><br>"A, lão đại, tiểu tử kia cua đại tẩu đây, hắn là cái thá gì a, chúng ta thực tế nhìn không được a." Phạm Kiếm nói.<br><br>"Ta hỏi ngươi, ta soái vẫn là tiểu tử kia soái?" Vương Hạo Nhiên đối tiểu đệ hỏi vặn lại.<br><br>"Đương nhiên là lão đại ngươi soái, tiểu tử kia tính toán cái gì, nhiều lắm thì ngũ quan nghiêm chỉnh."<br><br>Phạm Kiếm không có chút nào do dự trả lời, ở trong đó trọn vẹn không có vuốt mông ngựa ý tứ, bởi vì đây là sự thật.<br><br>"Đó là nhà ta thế tốt, vẫn là nhà của tiểu tử kia thế tốt?" Vương Hạo Nhiên tiếp tục hỏi.<br><br>"Lão đại nhà ngươi mấy trăm ức tài sản đây, nhà của tiểu tử kia cảnh phổ thông, cái này trọn vẹn không khả năng so sánh."<br><br>"Đó là ta thành tích tốt, vẫn là tiểu tử kia thành tích tốt đây?"<br><br>"Lão đại ngươi thành tích toàn trường trước mười, thật tốt học bá, tiểu tử kia đếm ngược, liền một học tra."<br><br>"Vậy liền hết à? Ta như vậy điều kiện tốt, chẳng lẽ còn sẽ thua bởi ở cuối xe tiểu tử nghèo? Muốn các ngươi quản nhiều cái gì nhàn sự?"<br><br>"Lão đại, ta hiểu được minh bạch, là chúng ta uổng công vô ích, không có ngươi phân phó, chúng ta sẽ không nhiều chuyện.<br><br>Tiểu tử kia căn bản không xứng cùng ngươi so." Phạm Kiếm cuối cùng là hiểu rõ.<br><br>Vương Hạo Nhiên gật đầu một cái, dùng ngu khiến cho ánh mắt nhìn một chút cái này bại não tiểu đệ.<br><br>Bỗng nhiên, trong đầu xuất hiện một đạo hệ thống nhắc nhở tin tức.<br><br>【 đinh, dẫn dắt tiểu đệ hành động, thoáng thay đổi nội dung truyện hướng đi, thu được điểm phản phái 100. 】 </div></div>`

const Reading = () => {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ bookId: string }>()
  const refTimeout = useRef<NodeJS.Timeout>()
  const [chapterContent, setChapterContent] = useState(test1)
  const [visibleSheet, setVisibleSheet] = useState(false)
  const reading = useReading()
  const bookId = reading.currentBook

  const chapterHtml = useMemo(() => {
    return getChapterHtml(chapterContent, reading.font, reading.size, reading.line)
  }, [chapterContent, reading])

  useEffect(() => {
    const newId = params.bookId ? params.bookId : reading.currentBook
    if (!reading.books[newId]?.chapter) {
      const books = { ...reading.books }
      console.log(books)
      books[newId] = { chapter: 1, offset: 0 }
      console.log(books)
      setReadingContext({
        ...reading,
        isReading: true,
        currentBook: newId,
        books,
      })
    } else {
      setReadingContext({
        ...reading,
        isReading: true,
        currentBook: newId,
      })
    }

    return () => {
      setReadingContext({ ...reading, isReading: false })
    }
  }, [])

  useEffect(() => {
    const book = reading.currentBook
    const chapter = reading.books[book]?.chapter
    if (chapter) {
      getBookChapterContent(reading.currentBook, chapter)
        .then((c) => setChapterContent(c))
        .catch(showToastError)
    }
  }, [reading])

  const nextChapter = () => {
    clearTimeout(refTimeout.current)
    refTimeout.current = setTimeout(() => {
      const books = { ...reading.books }
      books[reading.currentBook].chapter = books[reading.currentBook].chapter + 1
      setReadingContext({ ...reading, books })
    }, 500)
  }
  const previousChapter = () => {
    clearTimeout(refTimeout.current)
    refTimeout.current = setTimeout(() => {
      const books = { ...reading.books }
      books[reading.currentBook].chapter = Math.max(books[reading.currentBook].chapter - 1, 0)
      setReadingContext({ ...reading, books })
    }, 500)
  }

  return (
    <Screen.Container safe={'all'} style={{ backgroundColor: '#F5F1E5' }}>
      <WebView
        style={{ flex: 1, backgroundColor: '#F5F1E5' }}
        source={{ html: chapterHtml, baseUrl: '' }}
        originWhitelist={['*']}
        onScroll={(syntheticEvent) => {
          const { contentOffset, layoutMeasurement, contentSize } = syntheticEvent.nativeEvent
          const offset = Math.round(contentOffset.y + layoutMeasurement.height)
          const contentHeight = Math.round(contentSize.height)
          if (offset > contentHeight + 100) nextChapter()
          if (contentOffset.y < -100) previousChapter()
        }}
      />
      <VectorIcon
        name="circle-chevron-left"
        font="FontAwesome6"
        size={20}
        buttonStyle={{ ...styles.buttonBack }}
        color={AppPalette.gray400}
        onPress={router.back}
      />
      <VectorIcon
        name="book"
        font="FontAwesome6"
        size={24}
        buttonStyle={{ ...styles.buttonInfo }}
        color={AppPalette.gray600}
        onPress={() => setVisibleSheet(true)}
      />
      <SheetBookInfo
        bookId={bookId}
        isVisible={visibleSheet}
        onClose={() => setVisibleSheet(false)}
      />
    </Screen.Container>
  )
}

export default Reading

const styles = StyleSheet.create({
  buttonInfo: {
    width: 44,
    height: 44,
    borderRadius: 40,
    backgroundColor: AppPalette.gray100,
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  buttonBack: {
    width: 44,
    height: 44,
    borderRadius: 40,
    position: 'absolute',
    left: 10,
  },
})
